import { Service } from "../entities/service.entity"

export interface ServiceListFilters {
    startDate?: string
    endDate?: string
    isActive?: string
    category?: string
}

export interface ServiceWithStats extends Service {
    totalCustomerServices: number
    lastReferanceDate: Date | string | null
    totalPoint: number
}

export interface IServiceRepository {
    findAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: ServiceListFilters
    ): Promise<{ data: ServiceWithStats[]; total: number }>

    findByCode(code: string, userId: number): Promise<ServiceWithStats | null>

    findAllServices(): Promise<Service[]>
}
