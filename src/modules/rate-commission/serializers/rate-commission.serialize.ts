import { RateCommission } from "../entities/rate-commission.entity"

export class RateCommissionSerializer {
    static single(item: RateCommission) {
        return {
            id: item.id,
            category: item.category,
            value: Number(item.value),
            type: item.type,
            startDate: item.startDate,
            endDate: item.endDate,
            notes: item.notes,
            service: item.service ? {
                code: item.service.code,
                name: item.service.name,
            } : null,
            createdBy: item.createdBy ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
            } : null,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }
    }

    static collection(items: RateCommission[]) {
        return items.map(item => this.single(item))
    }
}
