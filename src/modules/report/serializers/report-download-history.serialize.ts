import { ReportDownloadHistory } from "../entities/report-download-history.entity"

export class ReportDownloadHistorySerializer {
    static single(item: ReportDownloadHistory) {
        return {
            id: item.id,
            type: item.type,
            format: item.format,
            periodLabel: item.periodLabel,
            filters: item.filters,
            requestedBy: item.requestedBy ? { id: item.requestedBy.id, name: item.requestedBy.name } : null,
            createdAt: item.createdAt,
        }
    }

    static collection(data: ReportDownloadHistory[]) {
        return data.map(item => this.single(item))
    }
}
