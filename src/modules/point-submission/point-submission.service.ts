import { PointSubmission } from "./entities/point-submission.entity"
import { PointSubmissionStatus } from "./point-submission.enum"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { IPointSubmissionRepository, PointSubmissionListFilters } from "./interfaces/point-submission.repository.interface"
import { NisHelper } from "../../core/helpers/nis"
import { PointCalculator } from "../../core/helpers/point"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

export class PointSubmissionService {
    constructor(
        private readonly repository: IPointSubmissionRepository,
        private readonly nisHelper: NisHelper,
        private readonly pointCalculator: PointCalculator,
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

        // Validate all are pending
        const nonPending = submissions.filter(s => s.status !== PointSubmissionStatus.PENDING)
        if (nonPending.length > 0) {
            throw new BadRequestException(
                `${nonPending.length} submission(s) already processed and cannot be approved`
            )
        }

        if (submissions.length !== ids.length) {
            throw new NotFoundException("Some submissions were not found")
        }

        // Update status — processedAt stays null (queue marker)
        await this.repository.updateMany(ids, {
            status: PointSubmissionStatus.APPROVED,
            approvedById,
            approvedAt: new Date(),
            notes: notes || null,
        } as any)
    }

    /**
     * Process a single approved submission: sync NIS data and create point.
     * Called by the process-submissions job.
     */
    async processSubmission(submission: PointSubmission): Promise<void> {
        // Step 1: Sync account from NIS to local DB (already transactional internally)
        const syncResult = await this.nisHelper.syncAccountToLocal(
            submission.nisData.custServId,
            submission.userId
        )

        if (!syncResult) {
            throw new Error(`Failed to sync NIS account for custServId ${submission.nisData.custServId}`)
        }

        // Step 2: Create Point + mark processed in ONE transaction
        await this.unitOfWork.runInTransaction(async (manager) => {
            await this.pointCalculator.addPointsReward(manager, {
                customerServiceId: syncResult.customerServiceId,
                price: submission.price,
                point: submission.point,
                remainingPoint: submission.point,
                type: submission.type,
                pointSubmissionId: submission.id,
            })

            // Mark as processed inside same transaction
            await manager.getRepository(PointSubmission).update(submission.id, {
                processedAt: new Date(),
                lastError: null,
            })
        })
    }

    /**
     * Mark a submission as failed with error message and increment retry count.
     */
    async markFailed(id: number, error: string): Promise<void> {
        await this.repository.update(id, {
            retryCount: () => "retry_count + 1",
            lastError: error,
        } as any)
    }
}
