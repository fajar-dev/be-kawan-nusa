import { AppDataSource } from "../../config/database"
import { Service } from "./service.entity"
import { CreateServiceRequest, UpdateServiceRequest } from "./service.request"
import { NotFoundException } from "../../core/exceptions/base"

export class ServiceService {
    private repository = AppDataSource.getRepository(Service)

    async getAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit
        const [data, total] = await this.repository.findAndCount({
            take: limit,
            skip: skip,
            order: { createdAt: "DESC" }
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

    async create(data: CreateServiceRequest) {
        const service = this.repository.create(data)
        return await this.repository.save(service)
    }

    async update(id: number, data: UpdateServiceRequest) {
        const service = await this.getById(id)
        this.repository.merge(service, data)
        return await this.repository.save(service)
    }

    async delete(id: number) {
        const service = await this.getById(id)
        await this.repository.remove(service)
        return true
    }
}
