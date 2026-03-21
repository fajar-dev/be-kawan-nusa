export class ServiceResource {
    static single(service: any) {
        return {
            id: service.id,
            code: service.code,
            name: service.name,
            description: service.description,
            type: service.type,
            isActive: service.isActive,
            lastReferanceDate: service.lastReferanceDate || null,
            totalCustomerServices: service.totalCustomerServices || 0,
            totalPoint: service.totalPoint || 0
        }
    }

    static collection(services: any[]) {
        return services.map(service => this.single(service))
    }
}
