import { Reward } from "../entities/reward.entity"

export class RewardSerializer {
    static single(reward: Reward) {
        return {
            id: reward.id,
            customerServiceId: reward.customerServiceId,
            price: Number(reward.price),
            paymentDate: reward.paymentDate,
            expiredDate: reward.expiredDate,
            point: Number(reward.point),
            remainingPoint: Number(reward.remainingPoint),
            isExpired: new Date(reward.expiredDate).toISOString().split('T')[0] <= new Date().toISOString().split('T')[0],
            type: reward.type,
            customerService: reward.customerService ? {
                id: reward.customerService.id,
                serviceCode: reward.customerService.serviceCode,
                activationDate: reward.customerService.activationDate,
                startDate: reward.customerService.startDate,
                endDate: reward.customerService.endDate,
            } : null,
            service: reward.customerService?.service ? {
                code: reward.customerService.service.code,
                name: reward.customerService.service.name,
            } : null,
            customer: reward.customerService?.customer ? {
                id: reward.customerService.customer.id,
                name: reward.customerService.customer.name,
            } : null,
            createdAt: reward.createdAt,
        }
    }

    static collection(data: Reward[]) {
        return data.map(reward => this.single(reward))
    }
}
