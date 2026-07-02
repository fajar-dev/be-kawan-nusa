import { Brackets, In, IsNull, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { PointSubmission } from "../entities/point-submission.entity"
import { PointSubmissionStatus } from "../point-submission.enum"
import { IPointSubmissionRepository, PointSubmissionListFilters } from "../interfaces/point-submission.repository.interface"

export class PointSubmissionRepository implements IPointSubmissionRepository {
    private readonly repository: Repository<PointSubmission>

    constructor() {
        this.repository = AppDataSource.getRepository(PointSubmission)
    }

    async findAll(page: number, limit: number, q: string, sort: string, order: string, filters: PointSubmissionListFilters = {}): Promise<{ data: PointSubmission[]; total: number }> {
        const query = this.repository.createQueryBuilder("ps")
            .leftJoinAndSelect("ps.user", "user")
            .leftJoinAndSelect("ps.createdBy", "createdBy")
            .leftJoinAndSelect("ps.approvedBy", "approvedBy")

        if (filters.status) {
            query.andWhere("ps.status = :status", { status: filters.status })
        }

        if (filters.type) {
            query.andWhere("ps.type = :type", { type: filters.type })
        }

        if (filters.startDate) {
            query.andWhere("ps.createdAt >= :startDate", { startDate: filters.startDate })
        }

        if (filters.endDate) {
            query.andWhere("ps.createdAt <= :endDate", { endDate: filters.endDate })
        }

        if (q) {
            query.andWhere(new Brackets((qb) => {
                qb.where("user.firstName LIKE :q", { q: `%${q}%` })
                  .orWhere("user.lastName LIKE :q", { q: `%${q}%` })
                  .orWhere("JSON_EXTRACT(ps.nisData, '$.accountName') LIKE :q", { q: `%${q}%` })
                  .orWhere("JSON_EXTRACT(ps.nisData, '$.accountManager') LIKE :q", { q: `%${q}%` })
            }))
        }

        const sortAlias = sort.includes(".") ? sort : `ps.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<PointSubmission | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["user", "createdBy", "approvedBy"]
        })
    }

    async findByIds(ids: number[]): Promise<PointSubmission[]> {
        return await this.repository.find({
            where: { id: In(ids) },
            relations: ["user", "createdBy", "approvedBy"]
        })
    }

    async save(data: Partial<PointSubmission>): Promise<PointSubmission> {
        const entity = this.repository.create(data)
        return await this.repository.save(entity)
    }

    async update(id: number, data: Partial<PointSubmission>): Promise<void> {
        await this.repository.update(id, data)
    }

    async updateMany(ids: number[], data: Partial<PointSubmission>): Promise<void> {
        await this.repository.update(ids, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }

    async existsByCustServId(custServId: number, excludeId?: number): Promise<boolean> {
        const query = this.repository.createQueryBuilder("ps")
            .where("JSON_EXTRACT(ps.nisData, '$.custServId') = :custServId", { custServId })
            .andWhere("ps.status != 'rejected'")

        if (excludeId) {
            query.andWhere("ps.id != :excludeId", { excludeId })
        }

        const count = await query.getCount()
        return count > 0
    }

    async findUnprocessed(limit: number, maxRetries: number): Promise<PointSubmission[]> {
        return await this.repository.find({
            where: {
                status: PointSubmissionStatus.APPROVED,
                processedAt: IsNull(),
            },
            order: { approvedAt: "ASC" },
            relations: ["user"],
            take: limit,
        }).then(results => results.filter(r => r.retryCount < maxRetries))
    }
}
