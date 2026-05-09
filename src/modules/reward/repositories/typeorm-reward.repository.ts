import { Brackets, EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Reward } from "../entities/reward.entity"
import { IRewardRepository, RewardListFilters } from "../interfaces/reward.repository.interface"

export class TypeOrmRewardRepository implements IRewardRepository {
    private readonly repository: Repository<Reward>

    constructor() {
        this.repository = AppDataSource.getRepository(Reward)
    }

    async findAllByUserId(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: RewardListFilters = {}
    ): Promise<{ data: Reward[]; total: number }> {
        const query = this.repository.createQueryBuilder("reward")
            .leftJoinAndSelect("reward.customerService", "cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.customer", "customer")
            .where("cs.userId = :userId", { userId })

        this.applyCommonFilters(query, q, filters)

        const sortAlias = sort.includes(".") ? sort : `reward.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findAllByCustomerId(
        customerId: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: RewardListFilters = {}
    ): Promise<{ data: Reward[]; total: number }> {
        const query = this.repository.createQueryBuilder("reward")
            .leftJoinAndSelect("reward.customerService", "cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.customer", "customer")
            .where("customer.id = :customerId", { customerId })
            .andWhere("cs.userId = :userId", { userId })

        this.applyCommonFilters(query, q, filters)

        const sortAlias = sort.includes(".") ? sort : `reward.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async save(data: Partial<Reward>, manager?: EntityManager): Promise<Reward> {
        const repo = manager ? manager.getRepository(Reward) : this.repository
        return await repo.save(data)
    }

    private applyCommonFilters(query: any, q: string, filters: RewardListFilters) {
        if (q) {
            query.andWhere(new Brackets((qb: any) => {
                qb.where("reward.type LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("cs.serviceCode LIKE :q")
            }), { q: `%${q}%` })
        }
        if (filters.startDate) query.andWhere("reward.createdAt >= :startDate", { startDate: filters.startDate })
        if (filters.endDate) query.andWhere("reward.createdAt <= :endDate", { endDate: filters.endDate })
        if (filters.types?.length) query.andWhere("reward.type IN (:...types)", { types: filters.types })
    }
}
