import { Customer } from "../entities/customer.entity"

export interface CustomerListFilters {
    types?: string[]
    isActive?: string
    serviceCodes?: string[]
}

export interface CustomerDetail extends Customer {
    totalCustomerServices: number
    latestCustomerService: any
}

export interface ICustomerRepository {
    findAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: CustomerListFilters
    ): Promise<{ data: Customer[]; total: number }>

    findById(id: string, userId: number): Promise<CustomerDetail | null>
}
