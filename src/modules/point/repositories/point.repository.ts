import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Reward } from "../../reward/entities/reward.entity"
import { IPointRepository } from "../interfaces/point.repository.interface"

export class PointRepository implements IPointRepository {
    private readonly rewardRepository: Repository<Reward>

    constructor() {
        this.rewardRepository = AppDataSource.getRepository(Reward)
    }

    async getTotalAvailablePoints(userId: number): Promise<number> {
        const today = new Date().toISOString().split("T")[0]
        const result = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("SUM(reward.remainingPoint)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("reward.expiredDate > :today", { today })
            .getRawOne()
        return Number(result?.total || 0)
    }

    async saveRewards(rewards: Reward[], manager?: EntityManager): Promise<void> {
        const repo = manager ? manager.getRepository(Reward) : this.rewardRepository
        await repo.save(rewards)
    }
}
