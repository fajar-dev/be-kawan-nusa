import { PointSubmission } from "./entities/point-submission.entity"
import { PointSubmissionSchedule } from "./entities/point-submission-schedule.entity"
import { PointSubmissionStatus } from "./point-submission.enum"
import { PointType } from "../point/point.enum"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { IPointSubmissionRepository, PointSubmissionListFilters } from "./interfaces/point-submission.repository.interface"
import { JobQueue } from "../../core/queue/entities/job-queue.entity"
import { QueueType } from "../../core/queue/queue.constants"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

export class PointSubmissionService {
    constructor(
        private readonly repository: IPointSubmissionRepository,
        private readonly unitOfWork: IUnitOfWork,
    ) {}

    async getAll(page: number, limit: number, q: string, sort: string, order: string, filters: PointSubmissionListFilters = {}): Promise<{ data: PointSubmission[]; total: number }> {
        return await this.repository.findAll(page, limit, q, sort, order, filters)
    }

    async getById(id: number): Promise<PointSubmission> {
        const item = await this.repository.findById(id)
        if (!item) throw new NotFoundException("Point submission not found")
        return item
    }

    async checkAccountExists(custServId: number, userId: number, excludeId?: number): Promise<{ existsForUser: boolean; existsForOthers: boolean }> {
        const existsForUser = await this.repository.existsByCustServIdAndUser(custServId, userId, excludeId)
        const existsForOthers = await this.repository.existsByCustServId(custServId, excludeId)
        return { existsForUser, existsForOthers }
    }

    async create(data: Partial<PointSubmission>): Promise<PointSubmission> {
        data.point = Math.floor(Number(data.price || 0) / 100)
        return await this.repository.save(data)
    }

    async update(id: number, data: Partial<PointSubmission>): Promise<PointSubmission> {
        const existing = await this.getById(id)
        if (existing.status !== PointSubmissionStatus.PENDING) {
            throw new BadRequestException("Cannot edit a submission that has been approved")
        }
        if (data.price !== undefined) {
            data.point = Math.floor(Number(data.price) / 100)
        }
        await this.repository.update(id, data)
        return await this.getById(id)
    }

    async delete(id: number): Promise<void> {
        const existing = await this.getById(id)
        if (existing.status !== PointSubmissionStatus.PENDING) {
            throw new BadRequestException("Cannot delete a submission that has been approved")
        }
        await this.repository.delete(id)
    }

    async approve(ids: number[], approvedById: number, notes?: string): Promise<void> {
        const submissions = await this.repository.findByIds(ids)

        if (submissions.length !== ids.length) {
            throw new NotFoundException("Some submissions were not found")
        }

        // Validate all are pending
        const nonPending = submissions.filter(s => s.status !== PointSubmissionStatus.PENDING)
        if (nonPending.length > 0) {
            throw new BadRequestException(
                `${nonPending.length} submission(s) already processed and cannot be approved`
            )
        }

        // Approve + create queue entries (+ recurring schedules) in one transaction
        await this.unitOfWork.runInTransaction(async (manager) => {
            const now = new Date()
            const period = new Date(now.getFullYear(), now.getMonth(), 1) // first of current month

            // Update submission status
            await manager.getRepository(PointSubmission).update(ids, {
                status: PointSubmissionStatus.APPROVED,
                approvedById,
                approvedAt: now,
                notes: notes || null,
            })

            // Create queue entry for each submission (→ process-submissions creates the Point)
            const queueRepo = manager.getRepository(JobQueue)
            const queueEntries = submissions.map(submission => queueRepo.create({
                type: QueueType.POINT_SUBMISSION,
                referenceId: submission.id,
                payload: {
                    customerServiceId: submission.nisData.custServId,
                    userId: submission.userId,
                    price: Number(submission.price),
                    point: Math.floor(Number(submission.price) / 100),
                    pointType: submission.type,
                },
                period: period,
            }))

            await queueRepo.save(queueEntries)

            // For each MANUAL (scheduleId=null) Bulanan submission, start a recurring
            // schedule so a new pending submission is generated every following month.
            const scheduleRepo = manager.getRepository(PointSubmissionSchedule)
            for (const submission of submissions) {
                if (submission.type !== PointType.BULANAN || submission.scheduleId != null) continue

                // Skip if an active schedule already covers this user + account.
                const existing = await scheduleRepo
                    .createQueryBuilder("s")
                    .where("s.userId = :userId", { userId: submission.userId })
                    .andWhere("s.isActive = true")
                    .andWhere("JSON_EXTRACT(s.nisData, '$.custServId') = :custServId", { custServId: submission.nisData.custServId })
                    .getCount()
                if (existing > 0) continue

                await scheduleRepo.save(scheduleRepo.create({
                    userId: submission.userId,
                    nisData: submission.nisData,
                    price: submission.price,
                    anchorDay: now.getDate(),
                    lastGeneratedPeriod: period,
                    isActive: true,
                    sourceSubmissionId: submission.id,
                    createdById: approvedById,
                }))
            }
        })
    }

    async getSchedules(page: number, limit: number, isActive?: boolean): Promise<{ data: PointSubmissionSchedule[]; total: number }> {
        const repo = this.unitOfWork.getManager().getRepository(PointSubmissionSchedule)
        const query = repo.createQueryBuilder("s")
            .leftJoinAndSelect("s.user", "user")
            .leftJoinAndSelect("s.createdBy", "createdBy")
            .leftJoinAndSelect("s.stoppedBy", "stoppedBy")
            .orderBy("s.createdAt", "DESC")

        if (isActive !== undefined) {
            query.where("s.isActive = :isActive", { isActive })
        }

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async stopSchedule(id: number, stoppedById: number): Promise<void> {
        const repo = this.unitOfWork.getManager().getRepository(PointSubmissionSchedule)
        const schedule = await repo.findOneBy({ id })
        if (!schedule) throw new NotFoundException("Schedule not found")
        if (!schedule.isActive) throw new BadRequestException("Schedule is already stopped")

        await repo.update(id, {
            isActive: false,
            stoppedById,
            stoppedAt: new Date(),
        })
    }
}
