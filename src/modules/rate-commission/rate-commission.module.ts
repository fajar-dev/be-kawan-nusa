import { RateCommissionRepository } from "./repositories/rate-commission.repository"
import { RateCommissionService } from "./rate-commission.service"
import { RateCommissionController } from "./rate-commission.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

const repository = new RateCommissionRepository()
const service = new RateCommissionService(repository, new TypeOrmUnitOfWork())
export const rateCommissionController = new RateCommissionController(service)
