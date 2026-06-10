import { CustomerService } from "../entities/customer-service.entity"

export class CustomerServiceSerializer {
    static single(item: CustomerService) {
        return {
            id: item.id,
            registrationDate: item.registrationDate,
            activationDate: item.activationDate,
            address: item.address,
            startDate: item.startDate,
            endDate: item.endDate,
            status: item.status,
            referenceDate: item.referenceDate,
            sales: item.sales ? {
                id: item.sales.id,
                name: item.sales.name,
                employeeId: item.sales.employeeId,
            } : null,
            service: item.service ? {
                code: item.service.code,
                name: item.service.name,
                type: item.service.type
            } : null,
            customer: item.customer ? {
                id: item.customer.id,
                name: item.customer.name,
                company: item.customer.company,
            } : null,
            totalPoint: (item as any).totalPoint ?? 0,
            latestReward: (item as any).latestReward ? {
                point: Number((item as any).latestReward.point),
                type: (item as any).latestReward.type,
                createdAt: (item as any).latestReward.createdAt
            } : null
        }
    }

    static collection(items: CustomerService[]) {
        return items.map(item => this.single(item))
    }
}
