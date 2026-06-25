import { UserRepository } from "./repositories/user.repository"
import { UserService } from "./user.service"
import { UserController } from "./user.controller"
import { customerServiceService } from "../customer-service/customer-service.module"
import { rewardService } from "../reward/reward.module"
import { redemptionService } from "../redemption/redemption.module"
import { statisticService } from "../statistic/statistic.module"

const repository = new UserRepository()
export const userService = new UserService(repository)
export const userController = new UserController(userService, customerServiceService, rewardService, redemptionService, statisticService)
