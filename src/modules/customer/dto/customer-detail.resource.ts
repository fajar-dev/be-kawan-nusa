import { Customer } from "../entities/customer.entity"
import { CustomerServiceResource } from "../../customer-service/dto/customer-service.resource"
import { CustomerResource } from "./customer.resource"

export class CustomerDetailResource {
    static single(customer: Customer) {
        return {
            ...CustomerResource.single(customer),
            totalCustomerServices: (customer as any).totalCustomerServices,
            latestCustomerService: (customer as any).latestCustomerService 
                ? CustomerServiceResource.single((customer as any).latestCustomerService)
                : null
        }
    }
}
