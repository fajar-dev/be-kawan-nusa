import { StatisticRepository } from "./repositories/statistic.repository"
import { StatisticService } from "./statistic.service"
import { StatisticController } from "./statistic.controller"
import { pointService } from "../point/point.module"

const repository = new StatisticRepository()
export const statisticService = new StatisticService(repository, pointService)
export const statisticController = new StatisticController(statisticService)
