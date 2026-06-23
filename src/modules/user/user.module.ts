import { TypeOrmUserRepository } from "./repositories/typeorm-user.repository"
import { UserService } from "./user.service"
import { UserController } from "./user.controller"
import { customerServiceService } from "../customer-service/customer-service.module"
import { rewardService } from "../reward/reward.module"
import { redemptionService } from "../redemption/redemption.module"
import { statisticService } from "../statistic/statistic.module"

const repository = new TypeOrmUserRepository()
export const userService = new UserService(repository)
export const userController = new UserController(userService, customerServiceService, rewardService, redemptionService, statisticService)
