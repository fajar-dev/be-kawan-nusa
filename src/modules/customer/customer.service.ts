import { AppDataSource } from "../../config/database"
import { Customer } from "./entities/customer.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Like } from "typeorm"

export class CustomerService {
    private repository = AppDataSource.getRepository(Customer)

    async getAll(userId: number, page: number = 1, limit: number = 10, q: string = "", sort: string = "createdAt", order: string = "DESC") {
        const skip = (page - 1) * limit
        const baseWhere = { userId }
        const where = q ? [
            { ...baseWhere, id: Like(`%${q}%`) },
            { ...baseWhere, name: Like(`%${q}%`) },
            { ...baseWhere, company: Like(`%${q}%`) },
            { ...baseWhere, salesName: Like(`%${q}%`) }
        ] : baseWhere

        const [data, total] = await this.repository.findAndCount({
            where,
            take: limit,
            skip: skip,
            relations: ["phones", "emails"],
            order: { [sort]: order }
        })
        return { data, total }
    }

    async getById(id: string, userId: number) {
        const customer = await this.repository.findOne({
            where: { id, userId },
            relations: ["phones", "emails"]
        })
        if (!customer) {
            throw new NotFoundException(`Customer not found`)
        }
        return customer
    }
}
