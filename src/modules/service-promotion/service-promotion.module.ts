import { TypeOrmServicePromotionRepository } from "./repositories/typeorm-service-promotion.repository"
import { ServicePromotionService } from "./service-promotion.service"
import { ServicePromotionController } from "./service-promotion.controller"

const servicePromotionRepository = new TypeOrmServicePromotionRepository()
const servicePromotionService = new ServicePromotionService(servicePromotionRepository)

export const servicePromotionController = new ServicePromotionController(servicePromotionService)
