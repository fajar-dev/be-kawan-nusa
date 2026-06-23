import { TypeOrmStatisticRepository } from "./repositories/typeorm-statistic.repository"
import { StatisticService } from "./statistic.service"
import { StatisticController } from "./statistic.controller"
import { pointService } from "../point/point.module"

const repository = new TypeOrmStatisticRepository()
export const statisticService = new StatisticService(repository, pointService)
export const statisticController = new StatisticController(statisticService)
