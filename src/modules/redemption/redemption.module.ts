import { TypeOrmRedemptionRepository } from "./repositories/typeorm-redemption.repository"
import { RedemptionService } from "./redemption.service"
import { RedemptionController } from "./redemption.controller"

const redemptionRepository = new TypeOrmRedemptionRepository()
const redemptionService = new RedemptionService(redemptionRepository)

export const redemptionController = new RedemptionController(redemptionService)
