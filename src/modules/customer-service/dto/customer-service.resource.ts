import { CustomerService } from "../entities/customer-service.entity"

export class CustomerServiceResource {
    static single(item: CustomerService) {
        return {
            id: item.id,
            customerId: item.customerId,
            serviceCode: item.serviceCode,
            registrationDate: item.registrationDate,
            activationDate: item.activationDate,
            startDate: item.startDate,
            endDate: item.endDate,
            status: item.status,
            referenceDate: item.referenceDate,
            salesName: item.salesName,
            service: item.service ? {
                code: item.service.code,
                name: item.service.name,
                type: item.service.type
            } : null
        }
    }

    static collection(items: CustomerService[]) {
        return items.map(item => this.single(item))
    }
}
