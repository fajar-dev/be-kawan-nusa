import { EntityManager, MoreThan } from "typeorm"
import { BadRequestException } from "../exceptions/base"
import { Reward } from "../../modules/reward/entities/reward.entity"

/**
 * Common point operations using FIFO logic.
 */
export class PointHelper {
    /**
     * Get the total available points for a user.
     */
    static async getAvailablePoints(manager: EntityManager, userId: number): Promise<number> {
        const today = new Date().toISOString().split('T')[0]
        const rewards = await manager.find(Reward, {
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
     */
    static async subtractPointsFIFO(manager: EntityManager, userId: number, amount: number) {
        const amountToSubtract = Number(amount)
        const today = new Date().toISOString().split('T')[0]

        // Fetch eligible rewards: not expired and has remaining points
        // Sorted by expiredDate (ASC) to use points that will expire sooner
        const rewards = await manager.find(Reward, {
            where: {
                customerService: { userId },
                remainingPoint: MoreThan(0),
                expiredDate: MoreThan(today as any)
            },
            order: { expiredDate: "ASC", createdAt: "ASC" },
            relations: ["customerService"]
        })

        // Check if total matches
        const totalAvailable = await this.getAvailablePoints(manager, userId)
        if (totalAvailable < amountToSubtract) {
            throw new BadRequestException(`Insufficient point balance. Available: ${totalAvailable}, Required: ${amountToSubtract}`)
        }

        let remainingToSubtract = amountToSubtract
        for (const reward of rewards) {
            if (remainingToSubtract <= 0) break

            const remainingInReward = Number(reward.remainingPoint)
            if (remainingInReward <= remainingToSubtract) {
                remainingToSubtract -= remainingInReward
                reward.remainingPoint = 0
            } else {
                reward.remainingPoint = remainingInReward - remainingToSubtract
                remainingToSubtract = 0
            }
            await manager.save(reward)
        }
    }

    /**
     * Add a new reward entry (this implicitly adds points to the available balance).
     */
    static async addPointsReward(manager: EntityManager, data: Partial<Reward>) {
        const reward = manager.create(Reward, data)
        return await manager.save(reward)
    }
}
