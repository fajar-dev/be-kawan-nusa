import { AppDataSource } from "../../config/database"
import { Customer } from "./entities/customer.entity"

import { CustomerService as CustomerServiceEntity } from "../customer-service/entities/customer-service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Brackets, Like, Repository } from "typeorm"

export class CustomerService {
    private repository: Repository<Customer>
    private customerServiceRepo: Repository<CustomerServiceEntity>

    constructor() {
        this.repository = AppDataSource.getRepository(Customer)
        this.customerServiceRepo = AppDataSource.getRepository(CustomerServiceEntity)
    }

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: { types?: string[], isActive?: string, serviceCodes?: string[] } = {}) {
        const skip = (page - 1) * limit
        const query = this.repository.createQueryBuilder("customer")
            .innerJoin("customer.services", "user_cs")
            .where("user_cs.userId = :userId", { userId })

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("customer.id LIKE :q")
                  .orWhere("customer.name LIKE :q")
                  .orWhere("customer.company LIKE :q")
            }), { q: `%${q}%` })
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

        const validSortFields = ["id", "name", "company", "registrationDate", "isActive", "createdAt", "updatedAt"]
        const finalSort = validSortFields.includes(sort) ? sort : "registrationDate"

        query.leftJoinAndSelect("customer.phones", "phones")
             .leftJoinAndSelect("customer.emails", "emails")
             .orderBy(`customer.${finalSort}`, order.toUpperCase() as any)

        const [data, total] = await query
            .groupBy("customer.id")
            .take(limit)
            .skip(skip)
            .getManyAndCount()

        return { data, total }
    }

    async getById(id: string, userId: number) {
        const customer = await this.repository.createQueryBuilder("customer")
            .leftJoinAndSelect("customer.phones", "phones")
            .leftJoinAndSelect("customer.emails", "emails")
            .innerJoin("customer.services", "cs")
            .where("customer.id = :id AND cs.userId = :userId", { id, userId })
            .getOne()

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
}
