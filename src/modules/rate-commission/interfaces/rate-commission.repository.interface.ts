import { RateCommission } from "../entities/rate-commission.entity"
import { PointType } from "../../point/point.enum"
import { RateCommissionValueType } from "../rate-commission.enum"

export interface RateCommissionListFilters {
    category?: PointType
    type?: RateCommissionValueType
    startDateFrom?: string
    startDateTo?: string
}

export interface IRateCommissionRepository {
    findAll(
        page: number, limit: number, q: string,
        sort: string, order: string, filters?: RateCommissionListFilters
    ): Promise<{ data: RateCommission[]; total: number }>

    findById(id: number): Promise<RateCommission | null>

    findByServiceAndCategory(serviceCode: string, category: PointType): Promise<RateCommission | null>

    findTakenServiceCodes(category: PointType): Promise<string[]>

    save(data: Partial<RateCommission>): Promise<RateCommission>

    delete(id: number): Promise<void>
}
