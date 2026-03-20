import { Service } from "../entities/service.entity"

export class ServiceResource {
    static single(service: Service) {
        return {
            id: service.id,
            code: service.code,
            name: service.name,
            description: service.description,
            type: service.type,
            isActive: service.isActive,
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
        }
    }

    static collection(services: Service[]) {
        return services.map(service => this.single(service))
    }
}
