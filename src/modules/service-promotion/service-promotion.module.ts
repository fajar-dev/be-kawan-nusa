import { TypeOrmServicePromotionRepository } from "./repositories/typeorm-service-promotion.repository"
import { ServicePromotionService } from "./service-promotion.service"
import { ServicePromotionController } from "./service-promotion.controller"

const repository = new TypeOrmServicePromotionRepository()
const service = new ServicePromotionService(repository)
export const servicePromotionController = new ServicePromotionController(service)
