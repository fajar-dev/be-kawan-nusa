import { TypeOrmCustomerServiceRepository } from "./repositories/typeorm-customer-service.repository"
import { CustomerServiceService } from "./customer-service.service"
import { CustomerServiceController } from "./customer-service.controller"

const customerServiceRepository = new TypeOrmCustomerServiceRepository()

export const customerServiceService = new CustomerServiceService(customerServiceRepository)
export const customerServiceController = new CustomerServiceController(customerServiceService)
