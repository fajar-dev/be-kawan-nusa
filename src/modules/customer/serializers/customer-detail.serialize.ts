import { Customer } from "../entities/customer.entity"
import { CustomerServiceSerializer } from "../../customer-service/serializers/customer-service.serialize"
import { CustomerSerializer } from "./customer.serialize"

export class CustomerDetailSerializer {
    static single(customer: Customer) {
        return {
            ...CustomerSerializer.single(customer),
            totalCustomerServices: (customer as any).totalCustomerServices,
            latestCustomerService: (customer as any).latestCustomerService 
                ? CustomerServiceSerializer.single((customer as any).latestCustomerService)
                : null
        }
    }
}
