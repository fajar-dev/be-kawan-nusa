import ExcelJS from "exceljs"

export interface ReportMetaRow {
    label: string
    value: string
}

export interface ReportColumn {
    header: string
    key: string
    width?: number
    numFmt?: string
    align?: "left" | "right" | "center"
}

export interface ReportBuildInput {
    title: string
    subtitle?: string
    meta: ReportMetaRow[]
    columns: ReportColumn[]
    rows: Record<string, unknown>[]
    /** Row property used to group rows for subtotal breaks (e.g. branch name). Omit for no grouping. */
    groupKey?: string
    /** Column keys to sum on subtotal / grand total rows. */
    sumKeys?: string[]
    /** Column key where the "Subtotal — <group>" / "GRAND TOTAL" label is written. Defaults to the first column. */
    labelKey?: string
    includeSummary: boolean
}

const sumRows = (rows: Record<string, unknown>[], keys: string[]): Record<string, number> => {
    const totals: Record<string, number> = {}
    for (const key of keys) totals[key] = 0
    for (const row of rows) {
        for (const key of keys) {
            const value = Number(row[key])
            if (!Number.isNaN(value)) totals[key] += value
        }
    }
    return totals
}

const groupRows = (rows: Record<string, unknown>[], groupKey: string): Map<string, Record<string, unknown>[]> => {
    const groups = new Map<string, Record<string, unknown>[]>()
    for (const row of rows) {
        const key = String(row[groupKey] ?? "-")
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(row)
    }
    return groups
}

export const buildXlsxReportBuffer = async (input: ReportBuildInput): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Kawan Nusa"
    workbook.created = new Date()

    // --- Sheet 1: Ringkasan ---
    const summarySheet = workbook.addWorksheet("Ringkasan")
    summarySheet.getColumn(2).width = 28
    summarySheet.getColumn(3).width = 50

    summarySheet.getCell("B2").value = "KAWAN NUSA"
    summarySheet.getCell("B2").font = { bold: true, size: 14 }
    summarySheet.getCell("B3").value = "Portal Referral PT. Media Antar Nusa"
    summarySheet.getCell("B5").value = input.title
    summarySheet.getCell("B5").font = { bold: true, size: 12 }
    if (input.subtitle) {
        summarySheet.getCell("B6").value = input.subtitle
        summarySheet.getCell("B6").font = { italic: true, color: { argb: "FF888888" } }
    }

    let row = 8
    summarySheet.getCell(`B${row}`).value = "PARAMETER LAPORAN"
    summarySheet.getCell(`B${row}`).font = { bold: true }
    row += 1
    for (const item of input.meta) {
        summarySheet.getCell(`B${row}`).value = item.label
        summarySheet.getCell(`B${row}`).font = { bold: true }
        summarySheet.getCell(`C${row}`).value = item.value
        row += 1
    }

    // --- Sheet 2: Data ---
    const dataSheet = workbook.addWorksheet("Data")
    dataSheet.columns = input.columns.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width ?? 18,
        style: col.numFmt ? { numFmt: col.numFmt } : undefined,
    }))
    dataSheet.getRow(1).font = { bold: true }
    dataSheet.getRow(1).alignment = { vertical: "middle" }

    const labelKey = input.labelKey ?? input.columns[0]?.key ?? ""
    const sumKeys = input.sumKeys ?? []

    if (input.groupKey && input.includeSummary) {
        const groups = groupRows(input.rows, input.groupKey)
        for (const [groupName, groupData] of groups) {
            for (const dataRow of groupData) dataSheet.addRow(dataRow)

            const subtotal: Record<string, unknown> = { [labelKey]: `Subtotal — Cabang ${groupName}` }
            Object.assign(subtotal, sumRows(groupData, sumKeys))
            const subtotalRow = dataSheet.addRow(subtotal)
            subtotalRow.font = { bold: true }
        }

        const grandTotal: Record<string, unknown> = { [labelKey]: "GRAND TOTAL — Semua Cabang" }
        Object.assign(grandTotal, sumRows(input.rows, sumKeys))
        const grandTotalRow = dataSheet.addRow(grandTotal)
        grandTotalRow.font = { bold: true }
        grandTotalRow.eachCell(cell => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } }
        })
    } else {
        for (const dataRow of input.rows) dataSheet.addRow(dataRow)

        if (input.includeSummary && sumKeys.length > 0) {
            const grandTotal: Record<string, unknown> = { [labelKey]: "GRAND TOTAL" }
            Object.assign(grandTotal, sumRows(input.rows, sumKeys))
            const grandTotalRow = dataSheet.addRow(grandTotal)
            grandTotalRow.font = { bold: true }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
}

const csvEscape = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value)
    if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
        return `"${str.replace(/"/g, "\"\"")}"`
    }
    return str
}

export const buildCsvReportBuffer = (input: ReportBuildInput): Buffer => {
    const lines: string[] = []
    lines.push(input.columns.map(col => csvEscape(col.header)).join(","))

    const labelKey = input.labelKey ?? input.columns[0]?.key ?? ""
    const sumKeys = input.sumKeys ?? []

    const writeRow = (row: Record<string, unknown>) => {
        lines.push(input.columns.map(col => csvEscape(row[col.key])).join(","))
    }

    if (input.groupKey && input.includeSummary) {
        const groups = groupRows(input.rows, input.groupKey)
        for (const [groupName, groupData] of groups) {
            for (const dataRow of groupData) writeRow(dataRow)
            const subtotal: Record<string, unknown> = { [labelKey]: `Subtotal — Cabang ${groupName}` }
            Object.assign(subtotal, sumRows(groupData, sumKeys))
            writeRow(subtotal)
        }
        const grandTotal: Record<string, unknown> = { [labelKey]: "GRAND TOTAL — Semua Cabang" }
        Object.assign(grandTotal, sumRows(input.rows, sumKeys))
        writeRow(grandTotal)
    } else {
        for (const dataRow of input.rows) writeRow(dataRow)
        if (input.includeSummary && sumKeys.length > 0) {
            const grandTotal: Record<string, unknown> = { [labelKey]: "GRAND TOTAL" }
            Object.assign(grandTotal, sumRows(input.rows, sumKeys))
            writeRow(grandTotal)
        }
    }

    return Buffer.from("﻿" + lines.join("\n"), "utf-8")
}

/** Masks all but the last 4 characters of a value, e.g. "8820117745" -> "******7745". */
export const maskTail = (value: string | null | undefined, keep = 4): string => {
    if (!value || value === "-") return value ?? "-"
    if (value.length <= keep) return value
    return "*".repeat(value.length - keep) + value.slice(-keep)
}
