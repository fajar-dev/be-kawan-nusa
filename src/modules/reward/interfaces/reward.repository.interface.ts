import { Reward } from "../entities/reward.entity"

export interface RewardListFilters {
    startDate?: string
    endDate?: string
    types?: string[]
}

export interface IRewardRepository {
    findAllByUserId(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: RewardListFilters
    ): Promise<{ data: Reward[]; total: number }>

    findAllByCustomerId(
        customerId: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters?: RewardListFilters
    ): Promise<{ data: Reward[]; total: number }>

    save(data: Partial<Reward>, manager?: any): Promise<Reward>
}
