import { AppDataSource } from "../../config/database"
import { Service } from "./entities/service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Like } from "typeorm"

export class ServiceService {
    private repository = AppDataSource.getRepository(Service)

    async getAll(page: number = 1, limit: number = 10, q: string = "", sort: string = "createdAt", order: string = "DESC") {
        const skip = (page - 1) * limit
        const where = q ? [
            { code: Like(`%${q}%`) },
            { name: Like(`%${q}%`) },
            { description: Like(`%${q}%`) }
        ] : {}

        const [data, total] = await this.repository.findAndCount({
            where,
            take: limit,
            skip: skip,
            order: { [sort]: order.toUpperCase() as any }
        })
        return { data, total }
    }

    async getById(id: number) {
        const service = await this.repository.findOneBy({ id })
        if (!service) {
            throw new NotFoundException(`Service with ID ${id} not found`)
        }
        return service
    }
}
