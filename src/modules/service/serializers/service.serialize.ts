export class ServiceSerializer {
    static single(service: any) {
        return {
            id: service.id,
            code: service.code,
            name: service.name,
            description: service.description,
            type: service.type,
            isActive: service.isActive,
            price: service.price,
            unit: service.unit,
            category: service.category,
            features: service.features,
            url: service.url,
            lastReferanceDate: service.lastReferanceDate || null,
            totalCustomerServices: service.totalCustomerServices || 0,
            totalPoint: service.totalPoint || 0
        }
    }

    static collection(services: any[]) {
        return services.map(service => this.single(service))
    }
}
