import { Reward } from "../../reward/entities/reward.entity"

export interface IPointRepository {
    getTotalAvailablePoints(userId: number): Promise<number>
    findExpiredWithRemainingPoints(userId: number): Promise<Reward[]>
    saveRewards(rewards: Reward[], manager?: any): Promise<void>
}
