import { TypeOrmCustomerServiceRepository } from "./repositories/typeorm-customer-service.repository"
import { CustomerServiceService } from "./customer-service.service"
import { CustomerServiceController } from "./customer-service.controller"

const repository = new TypeOrmCustomerServiceRepository()
export const customerServiceService = new CustomerServiceService(repository)
export const customerServiceController = new CustomerServiceController(customerServiceService)
