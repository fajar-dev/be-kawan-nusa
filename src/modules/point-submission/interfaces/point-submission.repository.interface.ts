import { PointSubmission } from "../entities/point-submission.entity"
import { PointSubmissionStatus } from "../point-submission.enum"

export interface PointSubmissionListFilters {
    status?: PointSubmissionStatus
    type?: string
    startDate?: string
    endDate?: string
}

export interface IPointSubmissionRepository {
    findAll(
        page: number, limit: number, q: string,
        sort: string, order: string, filters?: PointSubmissionListFilters
    ): Promise<{ data: PointSubmission[]; total: number }>

    findById(id: number): Promise<PointSubmission | null>

    findByIds(ids: number[]): Promise<PointSubmission[]>

    save(data: Partial<PointSubmission>): Promise<PointSubmission>

    update(id: number, data: Partial<PointSubmission>): Promise<void>

    updateMany(ids: number[], data: Partial<PointSubmission>): Promise<void>

    delete(id: number): Promise<void>

    existsByCustServId(custServId: number, excludeId?: number): Promise<boolean>

    existsByCustServIdAndUser(custServId: number, userId: number, excludeId?: number): Promise<boolean>
}
