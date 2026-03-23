import { AppDataSource } from "../../config/database"
import { Service } from "../service/entities/service.entity"
import { Repository } from "typeorm"
import { CustomerType } from "../customer/customer.enum"
import { CustomerServiceStatus } from "../customer-service/customer-service.enum"

export class AdditionalService {
    private serviceRepository: Repository<Service>

    constructor() {
        this.serviceRepository = AppDataSource.getRepository(Service)
    }

    /**
     * Get all services but only return code and name
     */
    async getServices() {
        return await this.serviceRepository.find({
            order: { name: "ASC" }
        })
    }

    /**
     * Get all customer types from enum
     */
    async getCustomerTypes() {
        return Object.entries(CustomerType)
            .map(([key, value]) => ({
                code: key,
                name: value
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }

    /**
     * Get all customer service status from enum
     */
    async getCustomerServiceStatus() {
        return Object.entries(CustomerServiceStatus).map(([key, value]) => ({
            code: key,
            name: value
        }))
    }
}
