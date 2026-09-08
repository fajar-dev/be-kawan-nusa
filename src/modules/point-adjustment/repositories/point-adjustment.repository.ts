import { Repository, Brackets } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { PointAdjustment } from "../entities/point-adjustment.entity"
import { PointAdjustmentStatus } from "../point-adjustment.enum"
import { IPointAdjustmentRepository, PointAdjustmentListFilters } from "../interfaces/point-adjustment.repository.interface"

const RELATIONS = ["pointSubmission", "pointSubmission.user", "requestedBy", "approver"]

export class PointAdjustmentRepository implements IPointAdjustmentRepository {
    private readonly repository: Repository<PointAdjustment>

    constructor() {
        this.repository = AppDataSource.getRepository(PointAdjustment)
    }

    private baseQuery(employeeId: number) {
        return this.repository.createQueryBuilder("pa")
            .leftJoinAndSelect("pa.pointSubmission", "submission")
            .leftJoinAndSelect("submission.user", "user")
            .leftJoinAndSelect("pa.requestedBy", "requestedBy")
            .leftJoinAndSelect("pa.approver", "approver")
            .where(new Brackets(qb => {
                qb.where("pa.requestedById = :employeeId", { employeeId })
                  .orWhere("pa.approverId = :employeeId", { employeeId })
            }))
    }

    async findAll(page: number, limit: number, filters: PointAdjustmentListFilters): Promise<{ data: PointAdjustment[]; total: number }> {
        const query = this.baseQuery(filters.involvingEmployeeId)

        if (filters.statuses?.length) {
            query.andWhere("pa.status IN (:...statuses)", { statuses: filters.statuses })
        }

        if (filters.q) {
            query.andWhere(new Brackets(qb => {
                qb.where("pa.code LIKE :q", { q: `%${filters.q}%` })
                  .orWhere("user.firstName LIKE :q", { q: `%${filters.q}%` })
                  .orWhere("user.lastName LIKE :q", { q: `%${filters.q}%` })
                  .orWhere("JSON_EXTRACT(submission.nisData, '$.accountName') LIKE :q", { q: `%${filters.q}%` })
                  .orWhere("JSON_EXTRACT(submission.nisData, '$.serviceName') LIKE :q", { q: `%${filters.q}%` })
            }))
        }

        query.orderBy("pa.createdAt", "DESC").take(limit).skip((page - 1) * limit)

        const [data, total] = await query.getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<PointAdjustment | null> {
        return await this.repository.findOne({ where: { id }, relations: RELATIONS })
    }

    async findOpenByPointSubmissionId(pointSubmissionId: number): Promise<PointAdjustment | null> {
        return await this.repository.findOne({
            where: [
                { pointSubmissionId, status: PointAdjustmentStatus.PENDING_APPROVAL },
                { pointSubmissionId, status: PointAdjustmentStatus.NEEDS_REVISION },
            ],
        })
    }

    async findApprovedPendingCreditByPointSubmissionId(pointSubmissionId: number): Promise<PointAdjustment | null> {
        return await this.repository.findOne({
            where: { pointSubmissionId, status: PointAdjustmentStatus.APPROVED_PENDING_CREDIT },
        })
    }

    async countByStatusForEmployee(employeeId: number): Promise<Record<PointAdjustmentStatus, number>> {
        const raw = await this.baseQuery(employeeId)
            .select("pa.status", "status")
            .addSelect("COUNT(*)", "count")
            .groupBy("pa.status")
            .getRawMany()

        const result: Record<PointAdjustmentStatus, number> = {
            [PointAdjustmentStatus.PENDING_APPROVAL]: 0,
            [PointAdjustmentStatus.NEEDS_REVISION]: 0,
            [PointAdjustmentStatus.APPROVED_PENDING_CREDIT]: 0,
            [PointAdjustmentStatus.COMPLETED]: 0,
        }
        for (const row of raw) {
            result[row.status as PointAdjustmentStatus] = Number(row.count)
        }
        return result
    }

    async save(data: Partial<PointAdjustment>): Promise<PointAdjustment> {
        const entity = this.repository.create(data)
        return await this.repository.save(entity)
    }

    async update(id: number, data: Partial<PointAdjustment>): Promise<void> {
        await this.repository.update(id, data)
    }

    async getLatestCodeSequence(yearPrefix: string): Promise<number> {
        const latest = await this.repository.createQueryBuilder("pa")
            .where("pa.code LIKE :prefix", { prefix: `PSN-${yearPrefix}-%` })
            .orderBy("pa.id", "DESC")
            .getOne()

        if (!latest) return 0
        const parts = latest.code.split("-")
        return Number(parts[2]) || 0
    }
}
