import { RedemptionStatusHistory } from "../entities/redemption-status-history.entity"

export class RedemptionStatusHistorySerializer {
    static single(item: RedemptionStatusHistory) {
        return {
            id: item.id,
            fromStatus: item.fromStatus,
            toStatus: item.toStatus,
            note: item.note,
            changedBy: item.changedBy ? {
                id: item.changedBy.id,
                name: item.changedBy.name,
            } : null,
            createdAt: item.createdAt,
        }
    }

    static collection(data: RedemptionStatusHistory[]) {
        return data.map(item => this.single(item))
    }
}
