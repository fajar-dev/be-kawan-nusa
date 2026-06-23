import { TypeOrmPointRepository } from "./repositories/typeorm-point.repository"
import { PointService } from "./point.service"
import { PointController } from "./point.controller"
import { PointCalculator } from "../../core/helpers/point"

const repository = new TypeOrmPointRepository()
export const pointService = new PointService(repository, new PointCalculator())
export const pointController = new PointController(pointService)
