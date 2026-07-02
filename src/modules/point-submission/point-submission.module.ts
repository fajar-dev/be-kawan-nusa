import { PointSubmissionRepository } from "./repositories/point-submission.repository"
import { PointSubmissionService } from "./point-submission.service"
import { PointSubmissionController } from "./point-submission.controller"
import { NisHelper } from "../../core/helpers/nis"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

const repository = new PointSubmissionRepository()
const nisHelper = new NisHelper()
const unitOfWork = new TypeOrmUnitOfWork()

export const pointSubmissionService = new PointSubmissionService(repository, unitOfWork)
export const pointSubmissionController = new PointSubmissionController(pointSubmissionService, nisHelper)
