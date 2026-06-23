import { TypeOrmRedemptionRepository } from "./repositories/typeorm-redemption.repository"
import { RedemptionService } from "./redemption.service"
import { RedemptionController } from "./redemption.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { PointCalculator } from "../../core/helpers/point"

const repository = new TypeOrmRedemptionRepository()
export const redemptionService = new RedemptionService(repository, new TypeOrmUnitOfWork(), new PointCalculator())
export const redemptionController = new RedemptionController(redemptionService)
