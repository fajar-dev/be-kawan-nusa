import { ServicePromotion } from "../entities/service-promotion.entity";
import { minio } from "../../../core/helpers/minio";

export class ServicePromotionSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo
        }
        return await minio.getPresignedUrl(photo)
    }

    static async single(item: ServicePromotion) {
        return {
            id: item.id,
            title: item.title,
            description: item.description,
            image: await this.resolvePhotoUrl(item.image),
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

    static async collection(items: ServicePromotion[]) {
        return Promise.all(items.map(item => this.single(item)))
    }
}
