import { Redemption } from "../entities/redemption.entity"
import { minio } from "../../../core/helpers/minio"

export class RedemptionProductListSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(redemption: Redemption) {
        const user = redemption.user
        const product = redemption.redemptionProduct

        return {
            id: redemption.id,
            redempNo: redemption.redempNo,
            pointsUsed: Number(redemption.pointsUsed),
            status: redemption.status,
            notes: redemption.notes,
            user: user ? {
                id: user.id,
                name: [user.firstName, user.lastName].filter(Boolean).join(' '),
                photo: await this.resolvePhotoUrl(user.photo),
                email: user.email,
                phone: user.phone,
            } : null,
            productDetails: product ? {
                catalog: product.catalog ? {
                    id: product.catalog.id,
                    name: product.catalog.name,
                    image: product.catalog.image,
                    category: product.catalog.category ? {
                        id: product.catalog.category.id,
                        name: product.catalog.category.name
                    } : null
                } : null,
                name: product.name,
                email: product.email,
                phone: product.phone,
                address: product.address,
                shipping: product.shipping ? {
                    id: product.shipping.id,
                    shipper: product.shipping.shipper,
                    trackingNumber: product.shipping.trackingNumber,
                    shippedAt: product.shipping.shippedAt
                } : null
            } : null,
            createdAt: redemption.createdAt,
        }
    }

    static async collection(data: Redemption[]) {
        return Promise.all(data.map(redemption => this.single(redemption)))
    }
}
