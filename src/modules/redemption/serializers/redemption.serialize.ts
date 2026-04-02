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
                catalogId: redemption.voucherRedemption.catalogId,
                catalog: redemption.voucherRedemption.catalog ? {
                    id: redemption.voucherRedemption.catalog.id,
                    name: redemption.voucherRedemption.catalog.name,
                    image: redemption.voucherRedemption.catalog.image
                } : null,
                name: redemption.voucherRedemption.name,
                email: redemption.voucherRedemption.email
            } : null,
            productDetails: redemption.productRedemption ? {
                catalogId: redemption.productRedemption.catalogId,
                catalog: redemption.productRedemption.catalog ? {
                    id: redemption.productRedemption.catalog.id,
                    name: redemption.productRedemption.catalog.name,
                    image: redemption.productRedemption.catalog.image
                } : null,
                name: redemption.productRedemption.name,
                email: redemption.productRedemption.email,
                phone: redemption.productRedemption.phone,
                address: redemption.productRedemption.address
            } : null,
            createdAt: redemption.createdAt,
            updatedAt: redemption.updatedAt
        }
    }

    static collection(data: Redemption[]) {
        return data.map(redemption => this.single(redemption))
    }
}
