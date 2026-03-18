import { Service } from "./service.entity"

export class ServiceResource {
    static single(service: Service) {
        return {
            id: service.id,
            name: service.name,
            description: service.description || "N/A",
            type: service.type,
            is_active: service.isActive,
            created_at: service.createdAt.toISOString(),
            updated_at: service.updatedAt.toISOString(),
        }
    }

    static collection(services: Service[]) {
        return services.map(service => this.single(service))
    }
}
