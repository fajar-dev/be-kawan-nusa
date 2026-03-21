import { Reward } from "../entities/reward.entity"

export class RewardResource {
    static single(reward: Reward) {
        return {
            id: reward.id,
            customerServiceId: reward.customerServiceId,
            price: Number(reward.price),
            point: Number(reward.point),
            type: reward.type,
            customerService: reward.customerService ? {
                id: reward.customerService.id,
                serviceCode: reward.customerService.serviceCode,
                activationDate: reward.customerService.activationDate,
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
