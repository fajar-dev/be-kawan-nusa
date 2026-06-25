import { CustomerRepository } from "./repositories/customer.repository"
import { CustomerService } from "./customer.service"
import { CustomerController } from "./customer.controller"

const repository = new CustomerRepository()
export const customerService = new CustomerService(repository)
export const customerController = new CustomerController(customerService)
