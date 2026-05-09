import { TypeOrmRewardRepository } from "./repositories/typeorm-reward.repository"
import { RewardService } from "./reward.service"
import { RewardController } from "./reward.controller"

const rewardRepository = new TypeOrmRewardRepository()

export const rewardService = new RewardService(rewardRepository)
export const rewardController = new RewardController(rewardService)
