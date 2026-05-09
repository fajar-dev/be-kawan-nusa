import { Service } from "./entities/service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { IServiceRepository, ServiceListFilters, ServiceWithStats } from "./interfaces/service.repository.interface"

export class ServiceService {
    constructor(private readonly repository: IServiceRepository) {}

    async getAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: ServiceListFilters = {}
    ): Promise<{ data: ServiceWithStats[]; total: number }> {
        return await this.repository.findAll(userId, page, limit, q, sort, order, filters)
    }

    async getByCode(code: string, userId: number): Promise<ServiceWithStats> {
        const service = await this.repository.findByCode(code, userId)
        if (!service) {
            throw new NotFoundException("Service not found")
        }
        return service
    }

    async getServices(): Promise<Service[]> {
        return await this.repository.findAllServices()
    }
}
