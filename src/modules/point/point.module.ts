import { TypeOrmPointRepository } from "./repositories/typeorm-point.repository"
import { PointService } from "./point.service"
import { PointController } from "./point.controller"

const pointRepository = new TypeOrmPointRepository()

export const pointService = new PointService(pointRepository)
export const pointController = new PointController(pointService)
