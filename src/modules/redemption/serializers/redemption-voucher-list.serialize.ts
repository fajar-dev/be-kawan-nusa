import { Redemption } from "../entities/redemption.entity"
import { minio } from "../../../core/helpers/minio"

export class RedemptionVoucherListSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(redemption: Redemption) {
        const user = redemption.user
        const voucher = redemption.redemptionVoucher

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
            voucherDetails: voucher ? {
                catalog: voucher.catalog ? {
                    id: voucher.catalog.id,
                    name: voucher.catalog.name,
                    image: voucher.catalog.image,
                    category: voucher.catalog.category ? {
                        id: voucher.catalog.category.id,
                        name: voucher.catalog.category.name
                    } : null
                } : null,
                name: voucher.name,
                email: voucher.email,
                detail: voucher.detail ? {
                    id: voucher.detail.id,
                    code: voucher.detail.code,
                    expiredDate: voucher.detail.expiredDate
                } : null
            } : null,
            createdAt: redemption.createdAt,
        }
    }

    static async collection(data: Redemption[]) {
        return Promise.all(data.map(redemption => this.single(redemption)))
    }
}
