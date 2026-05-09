import { TypeOrmServiceRepository } from "./repositories/typeorm-service.repository"
import { ServiceService } from "./service.service"
import { ServiceController } from "./service.controller"

const serviceRepository = new TypeOrmServiceRepository()

export const serviceService = new ServiceService(serviceRepository)
export const serviceController = new ServiceController(serviceService)
