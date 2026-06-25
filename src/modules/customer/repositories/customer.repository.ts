import { Brackets, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Customer } from "../entities/customer.entity"
import { CustomerService as CustomerServiceEntity } from "../../customer-service/entities/customer-service.entity"
import { CustomerDetail, CustomerListFilters, ICustomerRepository } from "../interfaces/customer.repository.interface"

export class CustomerRepository implements ICustomerRepository {
    private readonly repository: Repository<Customer>
    private readonly customerServiceRepo: Repository<CustomerServiceEntity>

    constructor() {
        this.repository = AppDataSource.getRepository(Customer)
        this.customerServiceRepo = AppDataSource.getRepository(CustomerServiceEntity)
    }

    async findAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerListFilters = {}
    ): Promise<{ data: Customer[]; total: number }> {
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

    async findById(id: string, userId: number): Promise<CustomerDetail | null> {
        const customer = await this.repository.createQueryBuilder("customer")
            .leftJoinAndSelect("customer.phones", "phones")
            .leftJoinAndSelect("customer.emails", "emails")
            .innerJoin("customer.services", "cs")
            .where("customer.id = :id AND cs.userId = :userId", { id, userId })
            .getOne()

        if (!customer) return null

        const [totalCustomerServices, latestCustomerService] = await Promise.all([
            this.customerServiceRepo.count({ where: { customerId: id } }),
            this.customerServiceRepo.findOne({
                where: { customerId: id },
                relations: ["service"],
                order: { referenceDate: "DESC" }
            })
        ])

        return { ...customer, totalCustomerServices, latestCustomerService }
    }
}
