import { AppDataSource } from "../../config/database"
import { CustomerService } from "./entities/customer-service.entity"
import { Customer } from "../customer/entities/customer.entity"
import { NotFoundException } from "../../core/exceptions/base"

export class CustomerServiceService {
    private repository = AppDataSource.getRepository(CustomerService)
    private customerRepository = AppDataSource.getRepository(Customer)

    async getAllByCustomer(customerId: string, userId: number, page: number = 1, limit: number = 10) {
        // Verify customer ownership
        const customer = await this.customerRepository.findOne({ where: { id: customerId, userId } })
        if (!customer) {
            throw new NotFoundException(`Customer not found`)
        }

        const skip = (page - 1) * limit
        const [data, total] = await this.repository.findAndCount({
            where: { customerId },
            relations: ["service"],
            take: limit,
            skip: skip,
            order: { createdAt: "DESC" }
        })
        return { data, total }
    }

    async getById(id: number, userId: number) {
        const item = await this.repository.findOne({
            where: { id },
            relations: ["service", "customer"]
        })

        if (!item || item.customer.userId !== userId) {
            throw new NotFoundException(`Customer service not found`)
        }

        return item
    }
}
