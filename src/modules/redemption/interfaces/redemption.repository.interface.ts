import { Redemption } from "../entities/redemption.entity"

export interface RedemptionListFilters {
    startDate?: string
    endDate?: string
    status?: string[]
    type?: string[]
    q?: string
}

export interface IRedemptionRepository {
    findAllByUserId(
        userId: number,
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }>

    findCashList(
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }>

    findByIdAndUserId(id: number, userId: number): Promise<Redemption | null>

    findReceiptByIdAndUserId(id: number, userId: number): Promise<Redemption | null>

    getLatestRedempNoByDate(dateStr: string): Promise<string | null>
}
