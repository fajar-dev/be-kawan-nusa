import { EntityManager, LessThanOrEqual, MoreThan, FindOptionsWhere } from "typeorm"
import { BadRequestException } from "../exceptions/base"
import { Point } from "../../modules/point/entities/point.entity"
import { Redemption } from "../../modules/redemption/entities/redemption.entity"
import { RedemptionType, RedemptionStatus } from "../../modules/redemption/redemption.enum"

/**
 * Point calculation engine using FIFO logic.
 *
 * Injectable service — replaces the old static PointHelper class.
 * All methods are instance methods so this class can be injected and mocked in tests.
 */
export class PointCalculator {
    /**
     * Get the total available points for a user.
     * Automatically expires any overdue rewards before calculating.
     */
    async getAvailablePoints(manager: EntityManager, userId: number): Promise<number> {
        // Lazy expiration: expire overdue rewards for this user first
        await this.expirePoints(manager, userId)

        const today = new Date().toISOString().split('T')[0]
        const rewards = await manager.find(Point, {
            where: {
                customerService: { userId },
                remainingPoint: MoreThan(0),
                expiredDate: MoreThan(today as any)
            }
        })

        return rewards.reduce((sum, r) => sum + Number(r.remainingPoint), 0)
    }

    /**
     * Deduct points from oldest rewards first.
     * Automatically expires any overdue rewards before deducting.
     */
    async subtractPointsFIFO(manager: EntityManager, userId: number, amount: number): Promise<{ id: number; value: number }[]> {
        // Lazy expiration: expire overdue rewards for this user first
        await this.expirePoints(manager, userId)

        const amountToSubtract = Number(amount)
        const today = new Date().toISOString().split('T')[0]

        // Fetch eligible rewards: not expired and has remaining points
        // Sorted by expiredDate (ASC) to use points that will expire sooner
        const rewards = await manager.find(Point, {
            where: {
                customerService: { userId },
                remainingPoint: MoreThan(0),
                expiredDate: MoreThan(today as any)
            },
            order: { expiredDate: "ASC", createdAt: "ASC" },
            relations: ["customerService"]
        })

        const totalAvailable = rewards.reduce((sum, r) => sum + Number(r.remainingPoint), 0)
        if (totalAvailable < amountToSubtract) {
            throw new BadRequestException(`Insufficient point balance. Available: ${totalAvailable}, Required: ${amountToSubtract}`)
        }

        const detail: { id: number; value: number }[] = []
        let remainingToSubtract = amountToSubtract
        for (const reward of rewards) {
            if (remainingToSubtract <= 0) break

            const remainingInReward = Number(reward.remainingPoint)
            let deducted: number
            if (remainingInReward <= remainingToSubtract) {
                deducted = remainingInReward
                remainingToSubtract -= remainingInReward
                reward.remainingPoint = 0
            } else {
                deducted = remainingToSubtract
                reward.remainingPoint = remainingInReward - remainingToSubtract
                remainingToSubtract = 0
            }
            detail.push({ id: reward.id, value: deducted })
            await manager.save(reward)
        }

        return detail
    }

    /**
     * Add a new reward entry (this implicitly adds points to the available balance).
     */
    async addPointsReward(manager: EntityManager, data: Partial<Point>) {
        const reward = manager.create(Point, data)
        return await manager.save(reward)
    }

    /**
     * Expire rewards that have passed their expiredDate.
     * Creates a redemption record with type "expired" for each expired reward.
     *
     * @param manager - EntityManager (within a transaction)
     * @param userId - Optional. If provided, only expire rewards for this user (lazy mode).
     *                 If omitted, expire all users' rewards (cron mode).
     */
    async expirePoints(manager: EntityManager, userId?: number): Promise<number> {
        const today = new Date().toISOString().split('T')[0]

        const where: FindOptionsWhere<Point> = {
            remainingPoint: MoreThan(0),
            expiredDate: LessThanOrEqual(today as any),
        }

        if (userId) {
            where.customerService = { userId }
        }

        // Find rewards with remaining points that have expired
        const expiredRewards = await manager.find(Point, {
            where,
            relations: ["customerService"],
        })

        let totalExpired = 0

        for (const reward of expiredRewards) {
            const expiredPoints = Number(reward.remainingPoint)
            if (expiredPoints <= 0) continue

            // Create expired redemption record
            const redemption = manager.create(Redemption, {
                userId: reward.customerService.userId,
                pointsUsed: expiredPoints,
                type: RedemptionType.EXPIRED,
                status: RedemptionStatus.EXPIRED,
                notes: `Auto-expired from reward #${reward.id}`,
                rewardOutDetail: [{ id: reward.id, value: expiredPoints }],
            })
            await manager.save(redemption)

            // Zero out the remaining points
            reward.remainingPoint = 0
            await manager.save(reward)

            totalExpired++
        }

        return totalExpired
    }
}
