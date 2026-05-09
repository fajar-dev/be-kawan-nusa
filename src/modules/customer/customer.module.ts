import { TypeOrmCustomerRepository } from "./repositories/typeorm-customer.repository"
import { CustomerService } from "./customer.service"
import { CustomerController } from "./customer.controller"

const customerRepository = new TypeOrmCustomerRepository()
const customerService = new CustomerService(customerRepository)

export const customerController = new CustomerController(customerService)
