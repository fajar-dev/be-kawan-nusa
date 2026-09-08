import { PointAdjustment } from "../entities/point-adjustment.entity"
import { PointAdjustmentStatus } from "../point-adjustment.enum"

export interface PointAdjustmentListFilters {
    /** Only records the employee requested or is the approver of. */
    involvingEmployeeId: number
    statuses?: PointAdjustmentStatus[]
    q?: string
}

export interface IPointAdjustmentRepository {
    findAll(page: number, limit: number, filters: PointAdjustmentListFilters): Promise<{ data: PointAdjustment[]; total: number }>
    findById(id: number): Promise<PointAdjustment | null>
    findOpenByPointSubmissionId(pointSubmissionId: number): Promise<PointAdjustment | null>
    findApprovedPendingCreditByPointSubmissionId(pointSubmissionId: number): Promise<PointAdjustment | null>
    countByStatusForEmployee(employeeId: number): Promise<Record<PointAdjustmentStatus, number>>
    save(data: Partial<PointAdjustment>): Promise<PointAdjustment>
    update(id: number, data: Partial<PointAdjustment>): Promise<void>
    getLatestCodeSequence(yearPrefix: string): Promise<number>
}
