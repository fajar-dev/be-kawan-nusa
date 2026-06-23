import { TypeOrmCustomerRepository } from "./repositories/typeorm-customer.repository"
import { CustomerService } from "./customer.service"
import { CustomerController } from "./customer.controller"

const repository = new TypeOrmCustomerRepository()
export const customerService = new CustomerService(repository)
export const customerController = new CustomerController(customerService)
