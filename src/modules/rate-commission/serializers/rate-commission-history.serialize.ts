import { RateCommissionHistory } from "../entities/rate-commission-history.entity"

export class RateCommissionHistorySerializer {
    static single(item: RateCommissionHistory) {
        return {
            id: item.id,
            action: item.action,
            fromValue: item.fromValue !== null && item.fromValue !== undefined ? Number(item.fromValue) : null,
            toValue: Number(item.toValue),
            fromType: item.fromType || null,
            toType: item.toType,
            fromStartDate: item.fromStartDate || null,
            toStartDate: item.toStartDate,
            fromEndDate: item.fromEndDate || null,
            toEndDate: item.toEndDate || null,
            notes: item.notes || null,
            service: item.rateCommission?.service ? {
                code: item.rateCommission.service.code,
                name: item.rateCommission.service.name,
            } : null,
            category: item.rateCommission?.category || null,
            changedBy: item.changedBy ? {
                id: item.changedBy.id,
                name: item.changedBy.name,
            } : null,
            createdAt: item.createdAt,
        }
    }

    static collection(data: RateCommissionHistory[]) {
        return data.map(item => this.single(item))
    }
}
