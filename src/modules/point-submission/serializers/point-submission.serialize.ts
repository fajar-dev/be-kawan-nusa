import { PointSubmission } from "../entities/point-submission.entity"

export class PointSubmissionSerializer {
    static single(item: PointSubmission) {
        return {
            id: item.id,
            type: item.type,
            point: Number(item.point),
            price: Number(item.price),
            nisData: item.nisData,
            status: item.status,
            isRecurring: item.isRecurring,
            recurringEndDate: item.recurringEndDate,
            notes: item.notes,
            user: item.user ? {
                id: item.user.id,
                name: `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim(),
            } : null,
            createdBy: item.createdBy ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
            } : null,
            approvedBy: item.approvedBy ? {
                id: item.approvedBy.id,
                name: item.approvedBy.name,
            } : null,
            approvedAt: item.approvedAt,
            createdAt: item.createdAt,
        }
    }

    static collection(data: PointSubmission[]) {
        return data.map(item => this.single(item))
    }
}
