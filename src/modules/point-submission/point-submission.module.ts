import { PointSubmissionRepository } from "./repositories/point-submission.repository"
import { PointSubmissionService } from "./point-submission.service"
import { PointSubmissionController } from "./point-submission.controller"
import { NisHelper } from "../../core/helpers/nis"
import { PointCalculator } from "../../core/helpers/point"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

const repository = new PointSubmissionRepository()
const nisHelper = new NisHelper()
const pointCalculator = new PointCalculator()
const unitOfWork = new TypeOrmUnitOfWork()

export const pointSubmissionService = new PointSubmissionService(repository, nisHelper, pointCalculator, unitOfWork)
export const pointSubmissionController = new PointSubmissionController(pointSubmissionService, nisHelper)
