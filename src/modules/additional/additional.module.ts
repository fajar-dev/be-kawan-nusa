import { AdditionalRepository } from "./repositories/additional.repository"
import { AdditionalService } from "./additional.service"
import { AdditionalController } from "./additional.controller"
import { serviceService } from "../service/service.module"

const repository = new AdditionalRepository()
const additionalService = new AdditionalService(repository)
export const additionalController = new AdditionalController(additionalService, serviceService)
