import { UserStatusHistory } from "../entities/user-status-history.entity"

export class UserStatusHistorySerializer {
    static single(item: UserStatusHistory) {
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

    static collection(data: UserStatusHistory[]) {
        return data.map(item => this.single(item))
    }
}
