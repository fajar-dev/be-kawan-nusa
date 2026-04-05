import { Redemption } from "../entities/redemption.entity"

export class RedemptionSerializer {
    static single(redemption: Redemption) {
        return {
            id: redemption.id,
            redempNo: redemption.redempNo,
            pointsUsed: Number(redemption.pointsUsed),
            type: redemption.type,
            status: redemption.status,
            notes: redemption.notes,
            withdrawDetails: redemption.withdrawRedemption ? {
                bankName: redemption.withdrawRedemption.bankName,
                accountNumber: redemption.withdrawRedemption.accountNumber,
                accountHolderName: redemption.withdrawRedemption.accountHolderName,
                payout: Number(redemption.withdrawRedemption.payout),
                tax: Number(redemption.withdrawRedemption.tax)
            } : null,
            voucherDetails: redemption.voucherRedemption ? {
                catalog: redemption.voucherRedemption.catalog ? {
                    id: redemption.voucherRedemption.catalog.id,
                    name: redemption.voucherRedemption.catalog.name,
                    image: redemption.voucherRedemption.catalog.image,
                    category: redemption.voucherRedemption.catalog.category ? {
                        id: redemption.voucherRedemption.catalog.category.id,
                        name: redemption.voucherRedemption.catalog.category.name
                    } : null
                } : null,
                name: redemption.voucherRedemption.name,
                email: redemption.voucherRedemption.email,
                detail: redemption.voucherRedemption.detail ? {
                    id: redemption.voucherRedemption.detail.id,
                    code: redemption.voucherRedemption.detail.code,
                    expiredDate: redemption.voucherRedemption.detail.expiredDate
                } : null
            } : null,
            productDetails: redemption.productRedemption ? {
                catalog: redemption.productRedemption.catalog ? {
                    id: redemption.productRedemption.catalog.id,
                    name: redemption.productRedemption.catalog.name,
                    image: redemption.productRedemption.catalog.image,
                    category: redemption.productRedemption.catalog.category ? {
                        id: redemption.productRedemption.catalog.category.id,
                        name: redemption.productRedemption.catalog.category.name
                    } : null
                } : null,
                name: redemption.productRedemption.name,
                email: redemption.productRedemption.email,
                phone: redemption.productRedemption.phone,
                address: redemption.productRedemption.address,
                shipping: redemption.productRedemption.shipping ? {
                    id: redemption.productRedemption.shipping.id,
                    shipper: redemption.productRedemption.shipping.shipper,
                    trackingNumber: redemption.productRedemption.shipping.trackingNumber,
                    shippedAt: redemption.productRedemption.shipping.shippedAt
                } : null
            } : null,
            createdAt: redemption.createdAt,
        }
    }

    static collection(data: Redemption[]) {
        return data.map(redemption => this.single(redemption))
    }
}
