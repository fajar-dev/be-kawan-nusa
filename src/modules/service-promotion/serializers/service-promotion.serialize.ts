import { ServicePromotion } from "../entities/service-promotion.entity";

export class ServicePromotionSerializer {
    static single(item: ServicePromotion) {
        return {
            id: item.id,
            title: item.title,
            description: item.description,
            image: item.image,
            url: item.url,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod,
            service: item.service ? {
                code: item.service.code,
                name: item.service.name
            } : null,
            createdAt: item.createdAt
        }
    }

    static collection(items: ServicePromotion[]) {
        return items.map(item => this.single(item))
    }
}
