import { AppDataSource } from "../../config/database"
import { CustomerService } from "./entities/customer-service.entity"
import { Customer } from "../customer/entities/customer.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Brackets, Repository } from "typeorm"

export class CustomerServiceService {
    private repository: Repository<CustomerService>
    private customerRepository: Repository<Customer>

    constructor() {
        this.repository = AppDataSource.getRepository(CustomerService)
        this.customerRepository = AppDataSource.getRepository(Customer)
    }

    async getAllByCustomer(
        customerId: string, 
        userId: number, 
        page: number, 
        limit: number, 
        q: string, 
        sort: string, 
        order: string
    ) {
        const customer = await this.customerRepository.findOneBy({ id: customerId, userId })
        if (!customer) {
            throw new NotFoundException("Customer not found")
        }

        const query = this.repository.createQueryBuilder("cs")
            .leftJoinAndSelect("cs.service", "service")
            .where("cs.customerId = :customerId", { customerId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("cs.serviceCode LIKE :q")
                  .orWhere("cs.salesName LIKE :q")
                  .orWhere("service.name LIKE :q")
            }), { q: searchPattern })
        }

        const sortAlias = sort.includes(".") ? sort : `cs.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        return { data, total }
    }
}
