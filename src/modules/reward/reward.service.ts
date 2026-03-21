import { AppDataSource } from "../../config/database"
import { Reward } from "./entities/reward.entity"
import { Brackets, Repository, EntityManager } from "typeorm"

export class RewardService {
    private repository: Repository<Reward>

    constructor() {
        this.repository = AppDataSource.getRepository(Reward)
    }

    async getByCustomerId(
        customerId: string, 
        userId: number, 
        page: number, 
        limit: number, 
        q: string, 
        sort: string, 
        order: string
    ) {
        const query = this.repository.createQueryBuilder("reward")
            .leftJoinAndSelect("reward.customerService", "cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.customer", "customer")
            .where("customer.id = :customerId", { customerId })
            .andWhere("customer.userId = :userId", { userId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("reward.type LIKE :q")
                  .orWhere("service.name LIKE :q")
            }), { q: searchPattern })
        }

        const sortAlias = sort.includes(".") ? sort : `reward.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        return { data, total }
    }

    async getAll(
        userId: number, 
        page: number, 
        limit: number, 
        q: string, 
        sort: string, 
        order: string
    ) {
        const query = this.repository.createQueryBuilder("reward")
            .leftJoinAndSelect("reward.customerService", "cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.customer", "customer")
            .where("customer.userId = :userId", { userId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("reward.type LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("cs.serviceCode LIKE :q")
            }), { q: searchPattern })
        }

        const sortAlias = sort.includes(".") ? sort : `reward.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        return { data, total }
    }

    async create(data: Partial<Reward>, manager?: EntityManager) {
        return manager ? manager.save(Reward, data) : this.repository.save(data)
    }
}
