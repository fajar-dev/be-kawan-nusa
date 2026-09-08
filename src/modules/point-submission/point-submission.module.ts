import { PointSubmissionRepository } from "./repositories/point-submission.repository"
import { PointSubmissionService } from "./point-submission.service"
import { PointSubmissionController } from "./point-submission.controller"
import { NisHelper } from "../../core/helpers/nis"
import { PointCalculator } from "../../core/helpers/point"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { pointAdjustmentService } from "../point-adjustment/point-adjustment.module"

const repository = new PointSubmissionRepository()
const nisHelper = new NisHelper()
const pointCalculator = new PointCalculator()
const unitOfWork = new TypeOrmUnitOfWork()

export const pointSubmissionService = new PointSubmissionService(repository, unitOfWork, nisHelper, pointCalculator, pointAdjustmentService)
export const pointSubmissionController = new PointSubmissionController(pointSubmissionService, nisHelper)
