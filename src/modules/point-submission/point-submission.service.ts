import { PointSubmission } from "./entities/point-submission.entity"
import { PointSubmissionStatus } from "./point-submission.enum"
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

    async checkAccountExists(custServId: number, excludeId?: number): Promise<boolean> {
        return await this.repository.existsByCustServId(custServId, excludeId)
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

        // Approve + create queue entries in one transaction
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

            // Create queue entry for each submission
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
        })
    }
}
