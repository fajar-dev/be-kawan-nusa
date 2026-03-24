import { Repository } from "typeorm"
import { CustomerType } from "../customer/customer.enum"
import { CustomerServiceStatus } from "../customer-service/customer-service.enum"
import { RewardPointType } from "../reward/reward.enum"

export class AdditionalService {
    async getCustomerTypes() {
        return Object.entries(CustomerType)
            .map(([key, value]) => ({
                code: key,
                name: value
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }

    async getCustomerServiceStatus() {
        return Object.entries(CustomerServiceStatus).map(([key, value]) => ({
            code: key,
            name: value
        }))
    }

    async getRewardPointTypes() {
        return Object.entries(RewardPointType).map(([key, value]) => ({
            code: key,
            name: value
        }))
    }
}
