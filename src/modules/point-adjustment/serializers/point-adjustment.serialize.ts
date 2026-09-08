import { PointAdjustment } from "../entities/point-adjustment.entity"
import { PointAdjustmentHistory } from "../entities/point-adjustment-history.entity"
import { PointSubmission } from "../../point-submission/entities/point-submission.entity"

export class PointAdjustmentSerializer {
    static eligibleSubmission(item: { submission: PointSubmission; branchName: string | null }) {
        const s = item.submission
        return {
            id: s.id,
            accountName: s.nisData.accountName,
            custId: s.nisData.custId,
            serviceName: s.nisData.serviceName,
            type: s.type,
            branchName: item.branchName,
            currentValue: Number(s.price),
            currentPoint: Number(s.point),
        }
    }

    static single(item: { adjustment: PointAdjustment; histories?: PointAdjustmentHistory[]; branchName?: string | null }) {
        const a = item.adjustment
        return {
            id: a.id,
            code: a.code,
            status: a.status,
            fromValue: Number(a.fromValue),
            toValue: Number(a.toValue),
            fromPoint: Number(a.fromPoint),
            toPoint: Number(a.toPoint),
            reason: a.reason,
            reviewNote: a.reviewNote,
            pointSubmission: a.pointSubmission ? {
                id: a.pointSubmission.id,
                accountName: a.pointSubmission.nisData.accountName,
                custId: a.pointSubmission.nisData.custId,
                serviceName: a.pointSubmission.nisData.serviceName,
                type: a.pointSubmission.type,
            } : null,
            branchName: item.branchName ?? null,
            requestedBy: a.requestedBy ? { id: a.requestedBy.id, name: a.requestedBy.name } : null,
            approver: a.approver ? { id: a.approver.id, name: a.approver.name } : null,
            histories: (item.histories ?? []).map(h => ({
                id: h.id,
                action: h.action,
                note: h.note,
                actor: h.actor ? { id: h.actor.id, name: h.actor.name } : null,
                createdAt: h.createdAt,
            })),
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        }
    }

    static collection(data: { adjustment: PointAdjustment; branchName: string | null }[]) {
        return data.map(item => this.single({ adjustment: item.adjustment, branchName: item.branchName }))
    }
}
