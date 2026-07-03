import { Catalog } from "../entities/catalog.entity";
import { minio } from "../../../core/helpers/minio";

export class CatalogSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo
        }
        return await minio.getPresignedUrl(photo)
    }

    static async single(item: any) {
        return {
            id: Number(item.id),
            name: item.name,
            type: item.type,
            description: item.description,
            point: Number(item.point),
            image: await this.resolvePhotoUrl(item.image),
            stock: Number(item.stock) || 0,
            stockUsed: Number(item.stockUsed) || 0,
            expiredDate: item.expiredDate,
            category: item.category ? {
                id: item.category.id,
                name: item.category.name
            } : null,
            createdBy: item.createdBy ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
                employeeId: item.createdBy.employeeId,
            } : null,
        }
    }

    static async collection(items: Catalog[]) {
        return Promise.all(items.map(item => this.single(item)))
    }
}
