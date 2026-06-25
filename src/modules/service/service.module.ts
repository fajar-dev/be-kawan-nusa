import { ServiceRepository } from "./repositories/service.repository"
import { ServiceService } from "./service.service"
import { ServiceController } from "./service.controller"

const repository = new ServiceRepository()
export const serviceService = new ServiceService(repository)
export const serviceController = new ServiceController(serviceService)
