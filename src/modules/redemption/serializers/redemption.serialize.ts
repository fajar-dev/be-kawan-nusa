import minio from "../../../core/helpers/minio"
import { Redemption } from "../entities/redemption.entity"

export class RedemptionSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(redemption: Redemption) {
        return {
            id: redemption.id,
            redempNo: redemption.redempNo,
            pointsUsed: Number(redemption.pointsUsed),
            type: redemption.type,
            status: redemption.status,
            notes: redemption.notes,
            withdrawDetails: redemption.redemptionWithdraw ? {
                bankName: redemption.redemptionWithdraw.bankName,
                accountNumber: redemption.redemptionWithdraw.accountNumber,
                accountHolderName: redemption.redemptionWithdraw.accountHolderName,
                payout: Number(redemption.redemptionWithdraw.payout),
                tax: Number(redemption.redemptionWithdraw.tax),
                receipt: await this.resolvePhotoUrl(redemption.redemptionWithdraw.receiptPath)
            } : null,
            voucherDetails: redemption.redemptionVoucher ? {
                catalog: redemption.redemptionVoucher.catalog ? {
                    id: redemption.redemptionVoucher.catalog.id,
                    name: redemption.redemptionVoucher.catalog.name,
                    image: redemption.redemptionVoucher.catalog.image,
                    category: redemption.redemptionVoucher.catalog.category ? {
                        id: redemption.redemptionVoucher.catalog.category.id,
                        name: redemption.redemptionVoucher.catalog.category.name
                    } : null
                } : null,
                name: redemption.redemptionVoucher.name,
                email: redemption.redemptionVoucher.email,
                detail: redemption.redemptionVoucher.detail ? {
                    id: redemption.redemptionVoucher.detail.id,
                    code: redemption.redemptionVoucher.detail.code,
                    expiredDate: redemption.redemptionVoucher.detail.expiredDate
                } : null
            } : null,
            productDetails: redemption.redemptionProduct ? {
                catalog: redemption.redemptionProduct.catalog ? {
                    id: redemption.redemptionProduct.catalog.id,
                    name: redemption.redemptionProduct.catalog.name,
                    image: redemption.redemptionProduct.catalog.image,
                    category: redemption.redemptionProduct.catalog.category ? {
                        id: redemption.redemptionProduct.catalog.category.id,
                        name: redemption.redemptionProduct.catalog.category.name
                    } : null
                } : null,
                name: redemption.redemptionProduct.name,
                email: redemption.redemptionProduct.email,
                phone: redemption.redemptionProduct.phone,
                address: redemption.redemptionProduct.address,
                shipping: redemption.redemptionProduct.shipping ? {
                    id: redemption.redemptionProduct.shipping.id,
                    shipper: redemption.redemptionProduct.shipping.shipper,
                    trackingNumber: redemption.redemptionProduct.shipping.trackingNumber,
                    shippedAt: redemption.redemptionProduct.shipping.shippedAt
                } : null
            } : null,
            createdAt: redemption.createdAt,
        }
    }

    static async collection(data: Redemption[]) {
        return await Promise.all(data.map(redemption => this.single(redemption)))
    }
}
