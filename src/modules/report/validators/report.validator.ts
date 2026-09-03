import { z } from "zod"
import { ReportType, ReportFormat, ReportDateBasis } from "../report.enum"

export const ReportQueryValidator = z.object({
    type: z.enum(ReportType),
    format: z.enum(ReportFormat).optional().default(ReportFormat.XLSX),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    snapshotDate: z.string().optional(),
    basis: z.enum(ReportDateBasis).optional(),
    branchCode: z.string().optional(),
    serviceCode: z.string().optional(),
    statuses: z.array(z.string()).optional(),
    includeSummary: z.coerce.boolean().optional().default(false),
    maskSensitive: z.coerce.boolean().optional().default(false),
})

export type ReportQueryValidator = z.infer<typeof ReportQueryValidator>
