import { CustomerType } from "../customer/customer.enum"
import { CustomerServiceStatus } from "../customer-service/customer-service.enum"
import { RewardPointType } from "../reward/reward.enum"
import { ServiceCategory } from "../service/service.enum"
import { IAdditionalRepository, SearchResult } from "./interfaces/additional.repository.interface"

export class AdditionalService {
    constructor(private readonly repository: IAdditionalRepository) {}

    async getServiceCategories() {
        return Object.entries(ServiceCategory).map(([key, value]) => ({ code: key, name: value }))
    }

    async getCustomerTypes() {
        return Object.entries(CustomerType)
            .map(([key, value]) => ({ code: key, name: value }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }

    async getCustomerServiceStatus() {
        return Object.entries(CustomerServiceStatus).map(([key, value]) => ({ code: key, name: value }))
    }

    async getRewardPointTypes() {
        return Object.entries(RewardPointType).map(([key, value]) => ({ code: key, name: value }))
    }

    async search(q: string, userId?: number): Promise<SearchResult[]> {
        return await this.repository.search(q, userId)
    }
}
