import { CustomerService } from "../entities/customer-service.entity"

export interface CustomerServiceListFilters {
    startDate?: string
    endDate?: string
    types?: string[]
    serviceCodes?: string[]
}

export interface CustomerServiceByCustomerFilters {
    startRegistration?: string
    endRegistration?: string
    startActivation?: string
    endActivation?: string
    status?: string[]
}

export interface CustomerServiceWithStats extends CustomerService {
    totalPoint: number
    latestPoint: any
}

export interface ICustomerServiceRepository {
    findAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: CustomerServiceListFilters
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }>

    findAllByCustomer(
        customerId: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: CustomerServiceByCustomerFilters
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }>

    findAllByService(
        serviceCode: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: CustomerServiceByCustomerFilters
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }>

    existsByCustomerAndUser(customerId: string, userId: number): Promise<boolean>
}
