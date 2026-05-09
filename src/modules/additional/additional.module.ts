import { TypeOrmAdditionalRepository } from "./repositories/typeorm-additional.repository"
import { serviceService } from "../service/service.module"
import { AdditionalService } from "./additional.service"
import { AdditionalController } from "./additional.controller"

const additionalRepository = new TypeOrmAdditionalRepository()
const additionalService = new AdditionalService(additionalRepository)

export const additionalController = new AdditionalController(additionalService, serviceService)
