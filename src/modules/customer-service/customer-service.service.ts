import { AppDataSource } from "../../config/database"
import { CustomerService } from "./entities/customer-service.entity"
import { Customer } from "../customer/entities/customer.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Brackets } from "typeorm"

export class CustomerServiceService {
    private repository = AppDataSource.getRepository(CustomerService)
    private customerRepository = AppDataSource.getRepository(Customer)

    async getAllByCustomer(customerId: string, userId: number, page: number = 1, limit: number = 10, q: string = "", sort: string = "referenceDate", order: string = "DESC") {
        // Verify customer ownership
        const customer = await this.customerRepository.findOne({ where: { id: customerId, userId } })
        if (!customer) {
            throw new NotFoundException(`Customer not found`)
        }

        const skip = (page - 1) * limit
        
        // Use QueryBuilder for more flexible searching and sorting
        const query = this.repository.createQueryBuilder("cs")
            .leftJoinAndSelect("cs.service", "service")
            .where("cs.customerId = :customerId", { customerId })

        if (q) {
            query.andWhere(
                new Brackets(qb => {
                    qb.where("cs.serviceCode LIKE :q", { q: `%${q}%` })
                      .orWhere("cs.salesName LIKE :q", { q: `%${q}%` })
                      .orWhere("service.name LIKE :q", { q: `%${q}%` })
                })
            )
        }

        // Handle sorting, including mapping for "name"
        if (sort === "name") {
            query.orderBy("service.name", order.toUpperCase() as any)
        } else {
            // Default to cs alias for other fields
            query.orderBy(`cs.${sort}`, order.toUpperCase() as any)
        }

        const [data, total] = await query
            .take(limit)
            .skip(skip)
            .getManyAndCount()

        return { data, total }
    }

    async getById(id: number, userId: number) {
        const item = await this.repository.findOne({
            where: { id },
            relations: ["service", "customer"]
        })

        if (!item || item.customer.userId !== userId) {
            throw new NotFoundException(`Customer service not found`)
        }

        return item
    }
}
