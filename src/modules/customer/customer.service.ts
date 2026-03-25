import { AppDataSource } from "../../config/database"
import { Customer } from "./entities/customer.entity"
import { CustomerAddress } from "./entities/customer-address.entity"
import { CustomerService as CustomerServiceEntity } from "../customer-service/entities/customer-service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Brackets, Like, Repository } from "typeorm"

export class CustomerService {
    private repository: Repository<Customer>
    private addressRepository: Repository<CustomerAddress>
    private customerServiceRepo: Repository<CustomerServiceEntity>

    constructor() {
        this.repository = AppDataSource.getRepository(Customer)
        this.addressRepository = AppDataSource.getRepository(CustomerAddress)
        this.customerServiceRepo = AppDataSource.getRepository(CustomerServiceEntity)
    }

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: { startDate?: string, endDate?: string, types?: string[], isActive?: string, serviceCodes?: string[] } = {}) {
        const skip = (page - 1) * limit
        const query = this.repository.createQueryBuilder("customer")
            .where("customer.userId = :userId", { userId })

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("customer.id LIKE :q")
                  .orWhere("customer.name LIKE :q")
                  .orWhere("customer.company LIKE :q")
                  .orWhere("customer.salesName LIKE :q")
            }), { q: `%${q}%` })
        }

        if (filters.startDate) {
            query.andWhere("customer.activationDate >= :startDate", { startDate: filters.startDate })
        }
        if (filters.endDate) {
            query.andWhere("customer.activationDate <= :endDate", { endDate: filters.endDate })
        }
        if (filters.types && filters.types.length > 0) {
            query.andWhere("customer.type IN (:...types)", { types: filters.types })
        }
        if (filters.isActive !== undefined && filters.isActive !== "") {
            query.andWhere("customer.isActive = :isActive", { isActive: filters.isActive === "1" })
        }
        if (filters.serviceCodes && filters.serviceCodes.length > 0) {
            query.innerJoin("customer.services", "cs")
                 .andWhere("cs.serviceCode IN (:...serviceCodes)", { serviceCodes: filters.serviceCodes })
        }

        query.leftJoinAndSelect("customer.phones", "phones")
             .leftJoinAndSelect("customer.emails", "emails")
             .orderBy(`customer.${sort}`, order.toUpperCase() as any)

        const [data, total] = await query
            .take(limit)
            .skip(skip)
            .getManyAndCount()

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
