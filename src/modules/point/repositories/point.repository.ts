import { Brackets, EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Point } from "../entities/point.entity"
import { IPointRepository, PointListFilters } from "../interfaces/point.repository.interface"

export class PointRepository implements IPointRepository {
    private readonly repository: Repository<Point>

    constructor() {
        this.repository = AppDataSource.getRepository(Point)
    }

    async findAllByUserId(userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: PointListFilters = {}): Promise<{ data: Point[]; total: number }> {
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

    async findAllByCustomerId(customerId: string, userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: PointListFilters = {}): Promise<{ data: Point[]; total: number }> {
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

    async getTotalAvailablePoints(userId: number): Promise<number> {
        const today = new Date().toISOString().split("T")[0]
        const result = await this.repository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("SUM(reward.remainingPoint)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("reward.expiredDate > :today", { today })
            .getRawOne()
        return Number(result?.total || 0)
    }

    async save(data: Partial<Point>, manager?: EntityManager): Promise<Point> {
        const repo = manager ? manager.getRepository(Point) : this.repository
        return await repo.save(data)
    }

    async saveMany(points: Point[], manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Point) : this.repository
        await repo.save(points)
    }

    private applyCommonFilters(query: any, q: string, filters: PointListFilters) {
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
