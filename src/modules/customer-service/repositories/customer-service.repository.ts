import { Brackets, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { CustomerService } from "../entities/customer-service.entity"
import { CustomerServiceReferral } from "../entities/customer-service-referral.entity"
import { Customer } from "../../customer/entities/customer.entity"
import { Point } from "../../point/entities/point.entity"
import {
    CustomerServiceByCustomerFilters,
    CustomerServiceListFilters,
    CustomerServiceWithStats,
    ICustomerServiceRepository,
} from "../interfaces/customer-service.repository.interface"

export class CustomerServiceRepository implements ICustomerServiceRepository {
    private readonly repository: Repository<CustomerService>
    private readonly customerRepository: Repository<Customer>

    constructor() {
        this.repository = AppDataSource.getRepository(CustomerService)
        this.customerRepository = AppDataSource.getRepository(Customer)
    }

    private mapToWithStats(entities: CustomerService[]): CustomerServiceWithStats[] {
        return entities.map(item => {
            const sortedRewards = (item.rewards || []).sort(
                (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            )
            return {
                ...item,
                totalPoint: (item.rewards || []).reduce((sum, r) => sum + Number(r.point), 0),
                latestPoint: sortedRewards[0] || null,
            }
        })
    }

    private applyRewardSort(query: any, sort: string, order: string) {
        if (sort === "latestPoint.point" || sort === "latestPoint.type") {
            const field = sort.split(".")[1]
            query.addSelect(
                (subQuery: any) =>
                    subQuery
                        .select(`r.${field}`)
                        .from(Point, "r")
                        .where("r.customerServiceId = cs.id")
                        .orderBy("r.createdAt", "DESC")
                        .limit(1),
                "latest_reward_field"
            )
            query.orderBy("latest_reward_field", order.toUpperCase() as any)
        } else if (sort === "totalPoint") {
            query.addSelect(
                (subQuery: any) =>
                    subQuery
                        .select("COALESCE(SUM(r2.point), 0)")
                        .from(Point, "r2")
                        .where("r2.customerServiceId = cs.id"),
                "total_point_sort"
            )
            query.orderBy("total_point_sort", order.toUpperCase() as any)
        } else {
            const sortAlias = sort.includes(".") ? sort : `cs.${sort}`
            query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")
        }
    }

    async findAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerServiceListFilters = {}
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }> {
        const query = this.repository.createQueryBuilder("cs")
            .innerJoinAndSelect("cs.customer", "customer")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.rewards", "reward")
            .leftJoinAndSelect("cs.sales", "sales")
            .innerJoin("cs.referrals", "ref", "ref.userId = :userId", { userId })

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("cs.serviceCode LIKE :q")
                  .orWhere("sales.name LIKE :q")
                  .orWhere("cs.address LIKE :q")
                  .orWhere("service.name LIKE :q")
            }), { q: `%${q}%` })
        }

        if (filters.startDate) query.andWhere("cs.registrationDate >= :startDate", { startDate: filters.startDate })
        if (filters.endDate) query.andWhere("cs.registrationDate <= :endDate", { endDate: filters.endDate })
        if (filters.serviceCodes?.length) {
            query.andWhere("cs.serviceCode IN (:...serviceCodes)", { serviceCodes: filters.serviceCodes })
        }
        if (filters.types?.length) {
            query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("r.type")
                    .from(Point, "r")
                    .where("r.customerServiceId = cs.id")
                    .orderBy("r.createdAt", "DESC")
                    .limit(1)
                    .getQuery()
                return `(${subQuery}) IN (:...types)`
            }, { types: filters.types })
        }

        this.applyRewardSort(query, sort, order)

        const [entities, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data: this.mapToWithStats(entities), total }
    }

    async findAllByCustomer(
        customerId: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerServiceByCustomerFilters = {}
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }> {
        const query = this.repository.createQueryBuilder("cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.rewards", "reward")
            .leftJoinAndSelect("cs.sales", "sales")
            .where("cs.customerId = :customerId", { customerId })
            .innerJoin("cs.referrals", "ref", "ref.userId = :userId", { userId })

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("cs.serviceCode LIKE :q")
                  .orWhere("sales.name LIKE :q")
                  .orWhere("cs.address LIKE :q")
                  .orWhere("service.name LIKE :q")
            }), { q: `%${q}%` })
        }

        if (filters.startRegistration) query.andWhere("cs.registrationDate >= :startRegistration", { startRegistration: filters.startRegistration })
        if (filters.endRegistration) query.andWhere("cs.registrationDate <= :endRegistration", { endRegistration: filters.endRegistration })
        if (filters.startActivation) query.andWhere("cs.activationDate >= :startActivation", { startActivation: filters.startActivation })
        if (filters.endActivation) query.andWhere("cs.activationDate <= :endActivation", { endActivation: filters.endActivation })
        if (filters.status?.length) query.andWhere("cs.status IN (:...status)", { status: filters.status })

        this.applyRewardSort(query, sort, order)

        const [entities, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data: this.mapToWithStats(entities), total }
    }

    async findAllByService(
        serviceCode: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: CustomerServiceByCustomerFilters = {}
    ): Promise<{ data: CustomerServiceWithStats[]; total: number }> {
        const query = this.repository.createQueryBuilder("cs")
            .innerJoinAndSelect("cs.customer", "customer")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.rewards", "reward")
            .leftJoinAndSelect("cs.sales", "sales")
            .where("cs.serviceCode = :serviceCode", { serviceCode })
            .innerJoin("cs.referrals", "ref", "ref.userId = :userId", { userId })

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("sales.name LIKE :q")
                  .orWhere("customer.name LIKE :q")
                  .orWhere("customer.id LIKE :q")
            }), { q: `%${q}%` })
        }

        if (filters.startRegistration) query.andWhere("cs.registrationDate >= :startRegistration", { startRegistration: filters.startRegistration })
        if (filters.endRegistration) query.andWhere("cs.registrationDate <= :endRegistration", { endRegistration: filters.endRegistration })
        if (filters.startActivation) query.andWhere("cs.activationDate >= :startActivation", { startActivation: filters.startActivation })
        if (filters.endActivation) query.andWhere("cs.activationDate <= :endActivation", { endActivation: filters.endActivation })
        if (filters.status?.length) query.andWhere("cs.status IN (:...status)", { status: filters.status })

        this.applyRewardSort(query, sort, order)

        const [entities, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data: this.mapToWithStats(entities), total }
    }

    async existsByCustomerAndUser(customerId: string, userId: number): Promise<boolean> {
        const count = await AppDataSource.getRepository(CustomerServiceReferral)
            .createQueryBuilder("ref")
            .innerJoin("ref.customerService", "cs")
            .where("cs.customerId = :customerId", { customerId })
            .andWhere("ref.userId = :userId", { userId })
            .getCount()
        return count > 0
    }
}
