import { ReportDownloadHistory } from "../entities/report-download-history.entity"
import { ReportType, ReportFormat } from "../report.enum"

export interface CreateReportDownloadHistoryData {
    type: ReportType
    format: ReportFormat
    periodLabel: string
    filters: Record<string, unknown> | null
    requestedById: number
}

export interface IReportDownloadHistoryRepository {
    create(data: CreateReportDownloadHistoryData): Promise<ReportDownloadHistory>
    findAll(page: number, limit: number, q?: string): Promise<{ data: ReportDownloadHistory[]; total: number }>
}
