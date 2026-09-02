import { PointSubmissionScheduleHistory } from "../entities/point-submission-schedule-history.entity"

export class PointSubmissionScheduleHistorySerializer {
    static single(item: PointSubmissionScheduleHistory) {
        return {
            id: item.id,
            fromPrice: Number(item.fromPrice),
            toPrice: Number(item.toPrice),
            fromAnchorDay: item.fromAnchorDay,
            toAnchorDay: item.toAnchorDay,
            changedBy: item.changedBy ? {
                id: item.changedBy.id,
                name: item.changedBy.name,
            } : null,
            createdAt: item.createdAt,
        }
    }

    static collection(data: PointSubmissionScheduleHistory[]) {
        return data.map(item => this.single(item))
    }
}
