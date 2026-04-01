import { AppDataSource } from "../../config/database"
import { EntityManager, Repository, MoreThan } from "typeorm"
import { BadValidatorException } from "../../core/exceptions/base"
import { Reward } from "../reward/entities/reward.entity"
import { PointHelper } from "../../core/helpers/point"

export class PointService {
    private rewardRepository: Repository<Reward>

    constructor() {
        this.rewardRepository = AppDataSource.getRepository(Reward)
    }

    /**
     * Get the total available points for a user by summing all non-expired remaining points.
     */
    async getByUserId(userId: number) {
        // Clean up expired points first to ensure DB matches logic
        await this.cleanupExpiredPoints(userId)

        const today = new Date().toISOString().split('T')[0]
        const result = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("SUM(reward.remainingPoint)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("reward.expiredDate > :today", { today })
            .getRawOne()

        return {
            value: Number(result?.total || 0)
        }
    }

    /**
     * Consume points using FIFO (First-In, First-Out) logic based on expiration date.
     */
    async subtractPoints(userId: number, points: number, manager: EntityManager) {
        await PointHelper.subtractPointsFIFO(manager, userId, points)
    }

    /**
     * Zeros out remainingPoint for expired records.
     */
    private async cleanupExpiredPoints(userId: number) {
        const today = new Date().toISOString().split('T')[0]
        
        // Find expired rewards for this user that still have remaining points
        const expiredRewards = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("reward.expiredDate <= :today", { today })
            .andWhere("reward.remainingPoint > 0")
            .getMany()

        if (expiredRewards.length > 0) {
            for (const reward of expiredRewards) {
                reward.remainingPoint = 0
            }
            await this.rewardRepository.save(expiredRewards)
        }
    }
}
