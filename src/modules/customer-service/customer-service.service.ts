import { AppDataSource } from "../../config/database"
import { CustomerService } from "./entities/customer-service.entity"
import { Customer } from "../customer/entities/customer.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { Reward } from "../reward/entities/reward.entity"
import { Brackets, Repository } from "typeorm"

export class CustomerServiceService {
    private repository: Repository<CustomerService>
    private customerRepository: Repository<Customer>

    constructor() {
        this.repository = AppDataSource.getRepository(CustomerService)
        this.customerRepository = AppDataSource.getRepository(Customer)
    }

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: { startDate?: string, endDate?: string, types?: string[], serviceCodes?: string[] } = {}) {
        const query = this.repository.createQueryBuilder("cs")
            .innerJoinAndSelect("cs.customer", "customer")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.rewards", "reward")
            .where("customer.userId = :userId", { userId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("cs.serviceCode LIKE :q")
                  .orWhere("cs.salesName LIKE :q")
                  .orWhere("cs.address LIKE :q")
                  .orWhere("service.name LIKE :q")
            }), { q: searchPattern })
        }

        if (filters.startDate) {
            query.andWhere("cs.registrationDate >= :startDate", { startDate: filters.startDate })
        }
        if (filters.endDate) {
            query.andWhere("cs.registrationDate <= :endDate", { endDate: filters.endDate })
        }
        if (filters.serviceCodes && filters.serviceCodes.length > 0) {
            query.andWhere("cs.serviceCode IN (:...serviceCodes)", { serviceCodes: filters.serviceCodes })
        }
        if (filters.types && filters.types.length > 0) {
            query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("r.type")
                    .from(Reward, "r")
                    .where("r.customerServiceId = cs.id")
                    .orderBy("r.createdAt", "DESC")
                    .limit(1)
                    .getQuery()
                return `(${subQuery}) IN (:...types)`
            }, { types: filters.types })
        }

        if (sort === "latestReward.point" || sort === "latestReward.type") {
            const field = sort.split(".")[1]
            query.addSelect(subQuery => {
                return subQuery
                    .select(`r.${field}`)
                    .from(Reward, "r")
                    .where("r.customerServiceId = cs.id")
                    .orderBy("r.createdAt", "DESC")
                    .limit(1)
            }, "latest_reward_field")
            query.orderBy("latest_reward_field", order.toUpperCase() as any)
        } else if (sort === "totalPoint") {
            query.addSelect(subQuery => {
                return subQuery
                    .select("COALESCE(SUM(r2.point), 0)")
                    .from(Reward, "r2")
                    .where("r2.customerServiceId = cs.id")
            }, "total_point_sort")
            query.orderBy("total_point_sort", order.toUpperCase() as any)
        } else {
            const sortAlias = sort.includes(".") ? sort : `cs.${sort}`
            query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")
        }

        const [entities, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        const data = entities.map(item => {
            const sortedRewards = (item.rewards || []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            return {
                ...item,
                totalPoint: (item.rewards || []).reduce((sum, r) => sum + Number(r.point), 0),
                latestReward: sortedRewards[0] || null
            }
        })

        return { data, total }
    }

    async getAllByCustomer(
        customerId: string, 
        userId: number, 
        page: number, 
        limit: number, 
        q: string, 
        sort: string, 
        order: string,
        filters: { startRegistration?: string, endRegistration?: string, startActivation?: string, endActivation?: string, status?: string[] } = {}
    ) {
        const customer = await this.customerRepository.findOneBy({ id: customerId, userId })
        if (!customer) {
            throw new NotFoundException("Customer not found")
        }

        const query = this.repository.createQueryBuilder("cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.rewards", "reward")
            .where("cs.customerId = :customerId", { customerId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("cs.serviceCode LIKE :q")
                  .orWhere("cs.salesName LIKE :q")
                  .orWhere("cs.address LIKE :q")
                  .orWhere("service.name LIKE :q")
            }), { q: searchPattern })
        }

        if (filters.startRegistration) {
            query.andWhere("cs.registrationDate >= :startRegistration", { startRegistration: filters.startRegistration })
        }
        if (filters.endRegistration) {
            query.andWhere("cs.registrationDate <= :endRegistration", { endRegistration: filters.endRegistration })
        }
        if (filters.startActivation) {
            query.andWhere("cs.activationDate >= :startActivation", { startActivation: filters.startActivation })
        }
        if (filters.endActivation) {
            query.andWhere("cs.activationDate <= :endActivation", { endActivation: filters.endActivation })
        }
        if (filters.status && filters.status.length > 0) {
            query.andWhere("cs.status IN (:...status)", { status: filters.status })
        }

        if (sort === "latestReward.point" || sort === "latestReward.type") {
            const field = sort.split(".")[1]
            query.addSelect(subQuery => {
                return subQuery
                    .select(`r.${field}`)
                    .from(Reward, "r")
                    .where("r.customerServiceId = cs.id")
                    .orderBy("r.createdAt", "DESC")
                    .limit(1)
            }, "latest_reward_field")
            query.orderBy("latest_reward_field", order.toUpperCase() as any)
        } else if (sort === "totalPoint") {
            query.addSelect(subQuery => {
                return subQuery
                    .select("COALESCE(SUM(r2.point), 0)")
                    .from(Reward, "r2")
                    .where("r2.customerServiceId = cs.id")
            }, "total_point_sort")
            query.orderBy("total_point_sort", order.toUpperCase() as any)
        } else {
            const sortAlias = sort.includes(".") ? sort : `cs.${sort}`
            query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")
        }

        const [entities, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        const data = entities.map(item => {
            const sortedRewards = (item.rewards || []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            return {
                ...item,
                totalPoint: (item.rewards || []).reduce((sum, r) => sum + Number(r.point), 0),
                latestReward: sortedRewards[0] || null
            }
        })

        return { data, total }
    }

    async getAllByService(
        serviceCode: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: { startRegistration?: string, endRegistration?: string, startActivation?: string, endActivation?: string, status?: string[] } = {}
    ) {
        const query = this.repository.createQueryBuilder("cs")
            .innerJoinAndSelect("cs.customer", "customer")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.rewards", "reward")
            .where("cs.serviceCode = :serviceCode", { serviceCode })
            .andWhere("customer.userId = :userId", { userId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("cs.salesName LIKE :q")
                  .orWhere("customer.name LIKE :q")
                  .orWhere("customer.id LIKE :q")
            }), { q: searchPattern })
        }

        if (filters.startRegistration) {
            query.andWhere("cs.registrationDate >= :startRegistration", { startRegistration: filters.startRegistration })
        }
        if (filters.endRegistration) {
            query.andWhere("cs.registrationDate <= :endRegistration", { endRegistration: filters.endRegistration })
        }
        if (filters.startActivation) {
            query.andWhere("cs.activationDate >= :startActivation", { startActivation: filters.startActivation })
        }
        if (filters.endActivation) {
            query.andWhere("cs.activationDate <= :endActivation", { endActivation: filters.endActivation })
        }
        if (filters.status && filters.status.length > 0) {
            query.andWhere("cs.status IN (:...status)", { status: filters.status })
        }

        if (sort === "latestReward.point" || sort === "latestReward.type") {
            const field = sort.split(".")[1]
            query.addSelect(subQuery => {
                return subQuery
                    .select(`r.${field}`)
                    .from(Reward, "r")
                    .where("r.customerServiceId = cs.id")
                    .orderBy("r.createdAt", "DESC")
                    .limit(1)
            }, "latest_reward_field")
            query.orderBy("latest_reward_field", order.toUpperCase() as any)
        } else if (sort === "totalPoint") {
            query.addSelect(subQuery => {
                return subQuery
                    .select("COALESCE(SUM(r2.point), 0)")
                    .from(Reward, "r2")
                    .where("r2.customerServiceId = cs.id")
            }, "total_point_sort")
            query.orderBy("total_point_sort", order.toUpperCase() as any)
        } else {
            const sortAlias = sort.includes(".") ? sort : `cs.${sort}`
            query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")
        }

        const [entities, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        const data = entities.map(item => {
            const sortedRewards = (item.rewards || []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            return {
                ...item,
                totalPoint: (item.rewards || []).reduce((sum, r) => sum + Number(r.point), 0),
                latestReward: sortedRewards[0] || null
            }
        })

        return { data, total }
    }
}
