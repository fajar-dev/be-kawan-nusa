import { AppDataSource } from "../../config/database"
import { Customer } from "./entities/customer.entity"
import { CustomerAddress } from "./entities/customer-address.entity"
import { CustomerService as CustomerServiceEntity } from "../customer-service/entities/customer-service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Like, Repository } from "typeorm"

export class CustomerService {
    private repository: Repository<Customer>
    private addressRepository: Repository<CustomerAddress>
    private customerServiceRepo: Repository<CustomerServiceEntity>

    constructor() {
        this.repository = AppDataSource.getRepository(Customer)
        this.addressRepository = AppDataSource.getRepository(CustomerAddress)
        this.customerServiceRepo = AppDataSource.getRepository(CustomerServiceEntity)
    }

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string) {
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
            throw new NotFoundException("Customer not found")
        }

        const [totalCustomerServices, latestCustomerService] = await Promise.all([
            this.customerServiceRepo.count({ where: { customerId: id } }),
            this.customerServiceRepo.findOne({
                where: { customerId: id },
                relations: ["service"],
                order: { referenceDate: "DESC" }
            })
        ])

        return {
            ...customer,
            totalCustomerServices,
            latestCustomerService
        }
    }

    async getAddresses(customerId: string, userId: number, page: number = 1, limit: number = 10) {
        const customer = await this.repository.findOne({ where: { id: customerId, userId } })
        if (!customer) {
            throw new NotFoundException("Customer not found")
        }

        const skip = (page - 1) * limit
        const [data, total] = await this.addressRepository.findAndCount({
            where: { customerId },
            take: limit,
            skip: skip,
            order: { createdAt: "DESC" }
        })
        return { data, total }
    }
}
