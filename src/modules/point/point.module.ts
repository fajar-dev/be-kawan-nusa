import { PointRepository } from "./repositories/point.repository"
import { PointService } from "./point.service"
import { PointController } from "./point.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { PointCalculator } from "../../core/helpers/point"

const repository = new PointRepository()
export const pointService = new PointService(repository, new TypeOrmUnitOfWork(), new PointCalculator())
export const pointController = new PointController(pointService)
