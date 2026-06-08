import { Reward } from "../../reward/entities/reward.entity"

export interface IPointRepository {
    getTotalAvailablePoints(userId: number): Promise<number>
    saveRewards(rewards: Reward[], manager?: any): Promise<void>
}
