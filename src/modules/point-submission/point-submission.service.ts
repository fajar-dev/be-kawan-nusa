import { PointSubmission } from "./entities/point-submission.entity"
import { PointSubmissionSchedule } from "./entities/point-submission-schedule.entity"
import { PointSubmissionScheduleHistory } from "./entities/point-submission-schedule-history.entity"
import { PointSubmissionStatus } from "./point-submission.enum"
import { PointType } from "../point/point.enum"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { IPointSubmissionRepository, PointSubmissionListFilters, ScheduleListFilters } from "./interfaces/point-submission.repository.interface"
import { Brackets } from "typeorm"
import { JobQueue } from "../../core/queue/entities/job-queue.entity"
import { QueueType } from "../../core/queue/queue.constants"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { NisHelper } from "../../core/helpers/nis"
import { PointCalculator } from "../../core/helpers/point"
import { createPointFromSubmission, PointSubmissionPayload } from "../../core/helpers/point-submission-processor"
import { logger } from "../../core/helpers/logger"

export class PointSubmissionService {
    constructor(
        private readonly repository: IPointSubmissionRepository,
        private readonly unitOfWork: IUnitOfWork,
        private readonly nisHelper: NisHelper,
        private readonly pointCalculator: PointCalculator,
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
        // Conversion rate: Rp 1.000 = 1 Poin (matches cash withdrawal rate in withdraw.ts)
        data.point = Math.floor(Number(data.price || 0) / 1000)
        return await this.repository.save(data)
    }

    async update(id: number, data: Partial<PointSubmission>): Promise<PointSubmission> {
        const existing = await this.getById(id)
        if (existing.status !== PointSubmissionStatus.PENDING) {
            throw new BadRequestException("Cannot edit a submission that has been approved")
        }
        if (data.price !== undefined) {
            data.point = Math.floor(Number(data.price) / 1000)
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

        const now = new Date()
        const period = new Date(now.getFullYear(), now.getMonth(), 1) // first of current month

        // Approve + start recurring schedules in one transaction
        await this.unitOfWork.runInTransaction(async (manager) => {
            // Update submission status
            await manager.getRepository(PointSubmission).update(ids, {
                status: PointSubmissionStatus.APPROVED,
                approvedById,
                approvedAt: now,
                notes: notes || null,
            })

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

        // Try to create the Point immediately for each approved submission.
        // Only fall back to the queue (picked up later by process-submissions)
        // when the immediate attempt fails, e.g. a transient NIS connectivity issue.
        const queueRepo = this.unitOfWork.getManager().getRepository(JobQueue)
        for (const submission of submissions) {
            const payload: PointSubmissionPayload = {
                customerServiceId: submission.nisData.custServId,
                userId: submission.userId,
                price: Number(submission.price),
                point: Math.floor(Number(submission.price) / 1000),
                pointType: submission.type,
            }

            try {
                await createPointFromSubmission(submission.id, payload, this.nisHelper, this.pointCalculator)
            } catch (error: any) {
                logger.error("Immediate point creation failed on approve, falling back to queue", {
                    pointSubmissionId: submission.id,
                    error: error?.message || String(error),
                })
                await queueRepo.save(queueRepo.create({
                    type: QueueType.POINT_SUBMISSION,
                    referenceId: submission.id,
                    payload,
                    period,
                }))
            }
        }
    }

    async getSchedules(page: number, limit: number, sort: string | undefined, order: string | undefined, filters: ScheduleListFilters = {}): Promise<{ data: PointSubmissionSchedule[]; total: number }> {
        const repo = this.unitOfWork.getManager().getRepository(PointSubmissionSchedule)
        const query = repo.createQueryBuilder("s")
            .leftJoinAndSelect("s.user", "user")
            .leftJoinAndSelect("s.createdBy", "createdBy")
            .leftJoinAndSelect("s.stoppedBy", "stoppedBy")

        if (filters.isActive !== undefined) {
            query.andWhere("s.isActive = :isActive", { isActive: filters.isActive })
        }

        if (filters.branchCodes && filters.branchCodes.length > 0) {
            query.andWhere("JSON_UNQUOTE(JSON_EXTRACT(s.nisData, '$.branchCode')) IN (:...branchCodes)", { branchCodes: filters.branchCodes })
        }

        if (filters.serviceCodes && filters.serviceCodes.length > 0) {
            query.andWhere("JSON_UNQUOTE(JSON_EXTRACT(s.nisData, '$.serviceCode')) IN (:...serviceCodes)", { serviceCodes: filters.serviceCodes })
        }

        if (filters.stoppedStartDate) {
            query.andWhere("s.stoppedAt >= :stoppedStartDate", { stoppedStartDate: filters.stoppedStartDate })
        }

        if (filters.stoppedEndDate) {
            query.andWhere("s.stoppedAt <= :stoppedEndDate", { stoppedEndDate: filters.stoppedEndDate })
        }

        if (filters.q) {
            query.andWhere(new Brackets((qb) => {
                qb.where("user.firstName LIKE :q", { q: `%${filters.q}%` })
                  .orWhere("user.lastName LIKE :q", { q: `%${filters.q}%` })
                  .orWhere("JSON_EXTRACT(s.nisData, '$.accountName') LIKE :q", { q: `%${filters.q}%` })
            }))
        }

        const sortMap: Record<string, string> = {
            user: "user.firstName",
            price: "s.price",
            point: "s.price", // point is derived (floor(price/1000)) — sorting by price preserves order
            anchorDay: "s.anchorDay",
            status: "s.isActive",
            stoppedAt: "s.stoppedAt",
            createdAt: "s.createdAt",
        }

        // branchCode/custId/serviceName live inside the nisData JSON column. TypeORM's
        // orderBy() naively splits its string argument on the first "." to find an
        // alias, which mangles a raw JSON_EXTRACT(...) expression — so the sort value
        // is added as a SELECT alias instead and ordered by that alias.
        const jsonSortPaths: Record<string, string> = {
            branchCode: "$.branchCode",
            custId: "$.custId",
            serviceName: "$.serviceName",
        }

        let sortField: string
        if (jsonSortPaths[sort || ""]) {
            query.addSelect("JSON_UNQUOTE(JSON_EXTRACT(s.nisData, :sortPath))", "sort_value")
                .setParameter("sortPath", jsonSortPaths[sort!])
            sortField = "sort_value"
        } else {
            sortField = sortMap[sort || ""] || "s.createdAt"
        }
        const sortOrder = (order || "").toUpperCase() === "ASC" ? "ASC" : "DESC"
        query.orderBy(sortField, sortOrder)

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

    /**
     * Adjust the monthly commission and/or generation day of an active schedule.
     * Future generated submissions use the new price (point = floor(price / 1000))
     * and/or the new anchorDay. Every actual change is recorded in
     * point_submission_schedule_histories for audit (who/when/from/to).
     */
    async adjustSchedule(id: number, data: { price?: number; anchorDay?: number }, changedById: number): Promise<PointSubmissionSchedule> {
        const repo = this.unitOfWork.getManager().getRepository(PointSubmissionSchedule)
        const schedule = await repo.findOneBy({ id })
        if (!schedule) throw new NotFoundException("Schedule not found")
        if (!schedule.isActive) throw new BadRequestException("Cannot adjust a stopped schedule")

        const fromPrice = Number(schedule.price)
        const fromAnchorDay = schedule.anchorDay
        const toPrice = data.price !== undefined ? data.price : fromPrice
        const toAnchorDay = data.anchorDay !== undefined ? data.anchorDay : fromAnchorDay

        if (toPrice !== fromPrice || toAnchorDay !== fromAnchorDay) {
            const historyRepo = this.unitOfWork.getManager().getRepository(PointSubmissionScheduleHistory)
            await historyRepo.save({
                scheduleId: id,
                fromPrice,
                toPrice,
                fromAnchorDay,
                toAnchorDay,
                changedById,
            })

            await repo.update(id, { price: toPrice, anchorDay: toAnchorDay })
        }

        return (await repo.findOneBy({ id }))!
    }

    async getScheduleHistories(scheduleId: number): Promise<PointSubmissionScheduleHistory[]> {
        const historyRepo = this.unitOfWork.getManager().getRepository(PointSubmissionScheduleHistory)
        return await historyRepo.find({
            where: { scheduleId },
            relations: ["changedBy"],
            order: { createdAt: "DESC" },
        })
    }
}
