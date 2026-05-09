import { Customer } from "./entities/customer.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { CustomerDetail, CustomerListFilters, ICustomerRepository } from "./interfaces/customer.repository.interface"

export class CustomerService {
    constructor(private readonly repository: ICustomerRepository) {}

    async getAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerListFilters = {}
    ): Promise<{ data: Customer[]; total: number }> {
        return await this.repository.findAll(userId, page, limit, q, sort, order, filters)
    }

    async getById(id: string, userId: number): Promise<CustomerDetail> {
        const customer = await this.repository.findById(id, userId)
        if (!customer) {
            throw new NotFoundException("Customer not found")
        }
        return customer
    }
}
