import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { IPointAdjustmentRepository } from "./interfaces/point-adjustment.repository.interface"
import { PointAdjustmentStatus, PointAdjustmentAction } from "./point-adjustment.enum"
import { PointAdjustment } from "./entities/point-adjustment.entity"
import { PointAdjustmentHistory } from "./entities/point-adjustment-history.entity"
import { PointSubmission } from "../point-submission/entities/point-submission.entity"
import { PointSubmissionStatus } from "../point-submission/point-submission.enum"
import { Employee } from "../employee/entities/employee.entity"
import { NotFoundException, BadRequestException, ForbiddenException } from "../../core/exceptions/base"

const STATUS_TAB_MAP: Record<string, PointAdjustmentStatus[]> = {
    menunggu_sm: [PointAdjustmentStatus.PENDING_APPROVAL],
    perlu_revisi: [PointAdjustmentStatus.NEEDS_REVISION],
    diproses: [PointAdjustmentStatus.APPROVED_PENDING_CREDIT],
    selesai: [PointAdjustmentStatus.COMPLETED],
}

export class PointAdjustmentService {
    constructor(
        private readonly repository: IPointAdjustmentRepository,
        private readonly unitOfWork: IUnitOfWork
    ) {}

    /**
     * PointSubmission has no direct Branch relation — nisData only carries the NIS
     * customer id, so "Cabang" is resolved the same way the report module does it:
     * via the locally-synced Customer row for that custId.
     */
    private async resolveBranchNames(custIds: string[]): Promise<Map<string, string>> {
        const unique = [...new Set(custIds)]
        if (unique.length === 0) return new Map()

        const rows = await this.unitOfWork.getManager().query(
            `SELECT c.id as custId, b.name as branchName
             FROM customers c LEFT JOIN branches b ON b.code = c.branch_code
             WHERE c.id IN (${unique.map(() => "?").join(",")})`,
            unique
        )
        return new Map(rows.map((r: any) => [r.custId, r.branchName]))
    }

    /** Pending submissions this employee created that have no open adjustment yet. */
    async getEligibleSubmissions(employeeId: number): Promise<{ submission: PointSubmission; branchName: string | null }[]> {
        const manager = this.unitOfWork.getManager()
        const submissions = await manager.getRepository(PointSubmission)
            .createQueryBuilder("ps")
            .where("ps.createdById = :employeeId", { employeeId })
            .andWhere("ps.status = :status", { status: PointSubmissionStatus.PENDING })
            .andWhere(`NOT EXISTS (
                SELECT 1 FROM point_adjustments pa
                WHERE pa.point_submission_id = ps.id
                AND pa.status IN (:...openStatuses)
            )`, { openStatuses: [PointAdjustmentStatus.PENDING_APPROVAL, PointAdjustmentStatus.NEEDS_REVISION] })
            .orderBy("ps.createdAt", "DESC")
            .getMany()

        const branchByCustId = await this.resolveBranchNames(submissions.map(s => s.nisData.custId))
        return submissions.map(submission => ({
            submission,
            branchName: branchByCustId.get(submission.nisData.custId) ?? null,
        }))
    }

    async hasOpenAdjustment(pointSubmissionId: number): Promise<boolean> {
        const open = await this.repository.findOpenByPointSubmissionId(pointSubmissionId)
        return open !== null
    }

    async create(pointSubmissionId: number, toValue: number, reason: string, requestedById: number) {
        const manager = this.unitOfWork.getManager()

        const submission = await manager.getRepository(PointSubmission).findOneBy({ id: pointSubmissionId })
        if (!submission) throw new NotFoundException("Entri poin tidak ditemukan")
        if (submission.status !== PointSubmissionStatus.PENDING) {
            throw new BadRequestException("Hanya entri yang masih Belum Disetujui yang bisa diajukan penyesuaian")
        }
        if (submission.createdById !== requestedById) {
            throw new ForbiddenException("Anda hanya dapat mengajukan penyesuaian untuk entri milik Anda sendiri")
        }

        const open = await this.repository.findOpenByPointSubmissionId(pointSubmissionId)
        if (open) throw new BadRequestException("Entri ini sudah memiliki pengajuan penyesuaian yang belum selesai")

        const requester = await manager.getRepository(Employee).findOneBy({ id: requestedById })
        if (!requester) throw new NotFoundException("Data karyawan pengaju tidak ditemukan")
        if (!requester.managerId) {
            throw new BadRequestException("Anda belum memiliki atasan (manager) yang ditentukan di data karyawan — hubungi HR/Admin sebelum mengajukan penyesuaian")
        }

        const year = String(new Date().getFullYear())
        const nextSeq = (await this.repository.getLatestCodeSequence(year)) + 1
        const code = `PSN-${year}-${String(nextSeq).padStart(4, "0")}`

        const toPoint = Math.floor(toValue / 1000)

        const adjustment = await this.repository.save({
            code,
            pointSubmissionId,
            requestedById,
            approverId: requester.managerId,
            fromValue: submission.price,
            toValue,
            fromPoint: submission.point,
            toPoint,
            reason,
            status: PointAdjustmentStatus.PENDING_APPROVAL,
        })

        await manager.getRepository(PointAdjustmentHistory).save({
            pointAdjustmentId: adjustment.id,
            action: PointAdjustmentAction.SUBMITTED,
            actorId: requestedById,
            note: null,
        })

        return await this.getById(adjustment.id, requestedById)
    }

    async getList(employeeId: number, page: number, limit: number, q: string, tab?: string) {
        const statuses = tab ? STATUS_TAB_MAP[tab] : undefined
        const { data, total } = await this.repository.findAll(page, limit, { involvingEmployeeId: employeeId, statuses, q })

        const branchByCustId = await this.resolveBranchNames(data.map(a => a.pointSubmission.nisData.custId))
        const withBranch = data.map(adjustment => ({
            adjustment,
            branchName: branchByCustId.get(adjustment.pointSubmission.nisData.custId) ?? null,
        }))

        return { data: withBranch, total }
    }

    async getCounts(employeeId: number) {
        const counts = await this.repository.countByStatusForEmployee(employeeId)
        return {
            menunggu_sm: counts[PointAdjustmentStatus.PENDING_APPROVAL],
            perlu_revisi: counts[PointAdjustmentStatus.NEEDS_REVISION],
            diproses: counts[PointAdjustmentStatus.APPROVED_PENDING_CREDIT],
            selesai: counts[PointAdjustmentStatus.COMPLETED],
        }
    }

    async getById(id: number, employeeId: number) {
        const adjustment = await this.repository.findById(id)
        if (!adjustment) throw new NotFoundException("Pengajuan penyesuaian tidak ditemukan")
        if (adjustment.requestedById !== employeeId && adjustment.approverId !== employeeId) {
            throw new ForbiddenException("Anda tidak berwenang melihat pengajuan ini")
        }

        const histories = await this.unitOfWork.getManager().getRepository(PointAdjustmentHistory).find({
            where: { pointAdjustmentId: id },
            relations: ["actor"],
            order: { createdAt: "ASC" },
        })

        const branchByCustId = await this.resolveBranchNames([adjustment.pointSubmission.nisData.custId])
        const branchName = branchByCustId.get(adjustment.pointSubmission.nisData.custId) ?? null

        return { adjustment, histories, branchName }
    }

    async review(id: number, action: "approve" | "reject", note: string | null, reviewerId: number) {
        const adjustment = await this.repository.findById(id)
        if (!adjustment) throw new NotFoundException("Pengajuan penyesuaian tidak ditemukan")
        if (adjustment.approverId !== reviewerId) {
            throw new ForbiddenException("Hanya atasan yang dituju yang dapat memutuskan pengajuan ini")
        }
        if (adjustment.status !== PointAdjustmentStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Pengajuan ini sudah tidak menunggu keputusan")
        }
        if (action === "reject" && !note?.trim()) {
            throw new BadRequestException("Catatan wajib diisi saat mengembalikan pengajuan untuk revisi")
        }

        await this.unitOfWork.runInTransaction(async (manager) => {
            if (action === "approve") {
                await manager.getRepository(PointSubmission).update(adjustment.pointSubmissionId, {
                    price: adjustment.toValue,
                    point: adjustment.toPoint,
                })
                await manager.getRepository(PointAdjustment).update(id, {
                    status: PointAdjustmentStatus.APPROVED_PENDING_CREDIT,
                    reviewNote: note || null,
                })
                await manager.getRepository(PointAdjustmentHistory).save({
                    pointAdjustmentId: id,
                    action: PointAdjustmentAction.APPROVED,
                    actorId: reviewerId,
                    note: note || null,
                })
            } else {
                await manager.getRepository(PointAdjustment).update(id, {
                    status: PointAdjustmentStatus.NEEDS_REVISION,
                    reviewNote: note,
                })
                await manager.getRepository(PointAdjustmentHistory).save({
                    pointAdjustmentId: id,
                    action: PointAdjustmentAction.RETURNED_FOR_REVISION,
                    actorId: reviewerId,
                    note,
                })
            }
        })

        return await this.getById(id, reviewerId)
    }

    async resubmit(id: number, toValue: number, reason: string, requesterId: number) {
        const adjustment = await this.repository.findById(id)
        if (!adjustment) throw new NotFoundException("Pengajuan penyesuaian tidak ditemukan")
        if (adjustment.requestedById !== requesterId) {
            throw new ForbiddenException("Anda hanya dapat mengubah pengajuan milik Anda sendiri")
        }
        if (adjustment.status !== PointAdjustmentStatus.NEEDS_REVISION) {
            throw new BadRequestException("Hanya pengajuan berstatus Perlu Revisi yang dapat diajukan ulang")
        }

        const toPoint = Math.floor(toValue / 1000)

        await this.repository.update(id, {
            toValue,
            toPoint,
            reason,
            status: PointAdjustmentStatus.PENDING_APPROVAL,
            reviewNote: null,
        })

        await this.unitOfWork.getManager().getRepository(PointAdjustmentHistory).save({
            pointAdjustmentId: id,
            action: PointAdjustmentAction.RESUBMITTED,
            actorId: requesterId,
            note: null,
        })

        return await this.getById(id, requesterId)
    }

    /** Called after a PointSubmission is approved through the normal Input Poin flow. */
    async markCreditedIfLinked(pointSubmissionId: number, creditedById: number): Promise<void> {
        const adjustment = await this.repository.findApprovedPendingCreditByPointSubmissionId(pointSubmissionId)
        if (!adjustment) return

        await this.repository.update(adjustment.id, { status: PointAdjustmentStatus.COMPLETED })
        await this.unitOfWork.getManager().getRepository(PointAdjustmentHistory).save({
            pointAdjustmentId: adjustment.id,
            action: PointAdjustmentAction.CREDITED,
            actorId: creditedById,
            note: null,
        })
    }
}
