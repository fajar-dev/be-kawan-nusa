import { PointAdjustmentRepository } from "./repositories/point-adjustment.repository"
import { PointAdjustmentService } from "./point-adjustment.service"
import { PointAdjustmentController } from "./point-adjustment.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

const repository = new PointAdjustmentRepository()
export const pointAdjustmentService = new PointAdjustmentService(repository, new TypeOrmUnitOfWork())
export const pointAdjustmentController = new PointAdjustmentController(pointAdjustmentService)
