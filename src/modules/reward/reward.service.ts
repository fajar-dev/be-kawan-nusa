import { AppDataSource } from "../../config/database"
import { Reward } from "./entities/reward.entity"
import { Brackets, Repository, EntityManager } from "typeorm"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { Point } from "../point/entities/point.entity"
import { PointService } from "../point/point.service"
import { NotFoundException } from "../../core/exceptions/base"

export class RewardService {
    private repository: Repository<Reward>
    private pointService: PointService

    constructor() {
        this.repository = AppDataSource.getRepository(Reward)
        this.pointService = new PointService()
    }

    async getByCustomerId(
        customerId: string, 
        userId: number, 
        page: number, 
        limit: number, 
        q: string, 
        sort: string, 
        order: string,
        filters: { startDate?: string, endDate?: string, types?: string[] } = {}
    ) {
        const query = this.repository.createQueryBuilder("reward")
            .leftJoinAndSelect("reward.customerService", "cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.customer", "customer")
            .where("customer.id = :customerId", { customerId })
            .andWhere("cs.userId = :userId", { userId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("reward.type LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("cs.serviceCode LIKE :q")
            }), { q: searchPattern })
        }

        if (filters.startDate) {
            query.andWhere("reward.createdAt >= :startDate", { startDate: filters.startDate })
        }
        if (filters.endDate) {
            query.andWhere("reward.createdAt <= :endDate", { endDate: filters.endDate })
        }
        if (filters.types && filters.types.length > 0) {
            query.andWhere("reward.type IN (:...types)", { types: filters.types })
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
        order: string,
        filters: { startDate?: string, endDate?: string, types?: string[] } = {}
    ) {
        const query = this.repository.createQueryBuilder("reward")
            .leftJoinAndSelect("reward.customerService", "cs")
            .leftJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("cs.customer", "customer")
            .where("cs.userId = :userId", { userId })

        if (q) {
            const searchPattern = `%${q}%`
            query.andWhere(new Brackets(qb => {
                qb.where("reward.type LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("cs.serviceCode LIKE :q")
            }), { q: searchPattern })
        }

        if (filters.startDate) {
            query.andWhere("reward.createdAt >= :startDate", { startDate: filters.startDate })
        }

        if (filters.endDate) {
            query.andWhere("reward.createdAt <= :endDate", { endDate: filters.endDate })
        }

        if (filters.types && filters.types.length > 0) {
            query.andWhere("reward.type IN (:...types)", { types: filters.types })
        }

        const sortAlias = sort.includes(".") ? sort : `reward.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        return { data, total }
    }

    async create(data: Partial<Reward>) {
        return await AppDataSource.transaction(async (manager) => {
            const cs = await manager.createQueryBuilder(CustomerService, "cs")
                .innerJoinAndSelect("cs.customer", "customer")
                .where("cs.id = :id", { id: data.customerServiceId })
                .getOne()

            if (!cs) {
                throw new NotFoundException("Customer service not found")
            }

            const ownerId = cs.userId

            const reward = manager.create(Reward, data)
            const savedReward = await manager.save(reward)

            const rewardPoints = Number(data.point || 0)
            await this.pointService.addPoints(ownerId, rewardPoints, manager)

            return savedReward
        })
    }
}
