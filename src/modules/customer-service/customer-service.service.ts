import { NotFoundException } from "../../core/exceptions/base"
import {
    CustomerServiceByCustomerFilters,
    CustomerServiceListFilters,
    CustomerServiceWithStats,
    ICustomerServiceRepository,
} from "./interfaces/customer-service.repository.interface"

export class CustomerServiceService {
    constructor(private readonly repository: ICustomerServiceRepository) {}

    async getAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerServiceListFilters = {}
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }> {
        return await this.repository.findAll(userId, page, limit, q, sort, order, filters)
    }

    async getAllByCustomer(
        customerId: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerServiceByCustomerFilters = {}
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }> {
        const exists = await this.repository.existsByCustomerAndUser(customerId, userId)
        if (!exists) {
            throw new NotFoundException("Customer not found")
        }
        return await this.repository.findAllByCustomer(customerId, userId, page, limit, q, sort, order, filters)
    }

    async getAllByService(
        serviceCode: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerServiceByCustomerFilters = {}
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }> {
        return await this.repository.findAllByService(serviceCode, userId, page, limit, q, sort, order, filters)
    }
}
