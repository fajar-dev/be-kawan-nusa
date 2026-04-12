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
            createdAt: item.createdAt
        }
    }

    static collection(items: ServicePromotion[]) {
        return items.map(item => this.single(item))
    }
}
