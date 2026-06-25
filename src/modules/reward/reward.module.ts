import { RewardRepository } from "./repositories/reward.repository"
import { RewardService } from "./reward.service"
import { RewardController } from "./reward.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { PointCalculator } from "../../core/helpers/point"

const repository = new RewardRepository()
export const rewardService = new RewardService(repository, new TypeOrmUnitOfWork(), new PointCalculator())
export const rewardController = new RewardController(rewardService)
