import { AppDataSource } from "../../config/database"
import { EntityManager } from "typeorm"
import { PointHelper } from "../../core/helpers/point"
import { Redemption } from "../redemption/entities/redemption.entity"
import { RedemptionType, RedemptionStatus } from "../redemption/redemption.enum"
import { IPointRepository } from "./interfaces/point.repository.interface"

export class PointService {
    constructor(private readonly repository: IPointRepository) {}

    async getByUserId(userId: number): Promise<{ value: number }> {
        await this.cleanupExpiredPoints(userId)
        const value = await this.repository.getTotalAvailablePoints(userId)
        return { value }
    }

    async subtractPoints(userId: number, points: number, manager: EntityManager): Promise<void> {
        await PointHelper.subtractPointsFIFO(manager, userId, points)
    }

    private async cleanupExpiredPoints(userId: number): Promise<void> {
        const expiredRewards = await this.repository.findExpiredWithRemainingPoints(userId)
        if (expiredRewards.length === 0) return

        await AppDataSource.transaction(async (manager) => {
            const redemptions: Partial<Redemption>[] = []

            for (const reward of expiredRewards) {
                redemptions.push({
                    userId,
                    pointsUsed: Number(reward.remainingPoint),
                    type: RedemptionType.EXPIRED,
                    status: RedemptionStatus.EXPIRED,
                })
                reward.remainingPoint = 0
            }

            await manager.save(expiredRewards)
            await manager.save(Redemption, redemptions)
        })
    }
}
