import { TypeOrmStatisticRepository } from "./repositories/typeorm-statistic.repository"
import { pointService } from "../point/point.module"
import { StatisticService } from "./statistic.service"
import { StatisticController } from "./statistic.controller"

const statisticRepository = new TypeOrmStatisticRepository()
export const statisticService = new StatisticService(statisticRepository, pointService)

export const statisticController = new StatisticController(statisticService)
