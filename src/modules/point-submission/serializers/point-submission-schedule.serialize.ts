import { PointSubmissionSchedule } from "../entities/point-submission-schedule.entity"

export class PointSubmissionScheduleSerializer {
    static single(item: PointSubmissionSchedule) {
        return {
            id: item.id,
            price: Number(item.price),
            point: Math.floor(Number(item.price) / 100),
            anchorDay: item.anchorDay,
            lastGeneratedPeriod: item.lastGeneratedPeriod,
            isActive: item.isActive,
            nisData: item.nisData,
            user: item.user ? {
                id: item.user.id,
                name: `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim(),
            } : null,
            createdBy: item.createdBy ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
            } : null,
            stoppedBy: item.stoppedBy ? {
                id: item.stoppedBy.id,
                name: item.stoppedBy.name,
            } : null,
            stoppedAt: item.stoppedAt,
            createdAt: item.createdAt,
        }
    }

    static collection(data: PointSubmissionSchedule[]) {
        return data.map(item => this.single(item))
    }
}
