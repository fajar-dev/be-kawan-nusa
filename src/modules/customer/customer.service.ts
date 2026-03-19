import { AppDataSource } from "../../config/database"
import { Customer } from "./entities/customer.entity"
import { CreateCustomerRequest, UpdateCustomerRequest } from "./dto/customer.request"
import { NotFoundException } from "../../core/exceptions/base"

export class CustomerService {
    private repository = AppDataSource.getRepository(Customer)

    async getAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit
        const [data, total] = await this.repository.findAndCount({
            take: limit,
            skip: skip,
            relations: ["phones", "emails"],
            order: { createdAt: "DESC" }
        })
        return { data, total }
    }

    async getById(id: string) {
        const customer = await this.repository.findOne({
            where: { id },
            relations: ["phones", "emails"]
        })
        if (!customer) {
            throw new NotFoundException(`Customer with ID ${id} not found`)
        }
        return customer
    }

    async create(data: CreateCustomerRequest) {
        const customer = this.repository.create(data)
        return await this.repository.save(customer)
    }

    async update(id: string, data: UpdateCustomerRequest) {
        const customer = await this.getById(id)
        this.repository.merge(customer, data)
        return await this.repository.save(customer)
    }
    async delete(id: string) {
        const customer = await this.getById(id)
        await this.repository.remove(customer)
        return true
    }
}
