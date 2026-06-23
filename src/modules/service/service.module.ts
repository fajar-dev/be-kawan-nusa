import { TypeOrmServiceRepository } from "./repositories/typeorm-service.repository"
import { ServiceService } from "./service.service"
import { ServiceController } from "./service.controller"

const repository = new TypeOrmServiceRepository()
export const serviceService = new ServiceService(repository)
export const serviceController = new ServiceController(serviceService)
