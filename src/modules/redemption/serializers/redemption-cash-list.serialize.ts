import { Redemption } from "../entities/redemption.entity"
import { minio } from "../../../core/helpers/minio"

export class RedemptionCashListSerializer {
    private static resolvePhotoUrl(photo?: string | null): string | null {
        if (!photo) return null
        return minio.getProxyUrl(photo)
    }

    static single(redemption: Redemption) {
        const user = redemption.user
        const withdraw = redemption.redemptionWithdraw

        return {
            id: redemption.id,
            redempNo: redemption.redempNo,
            pointsUsed: Number(redemption.pointsUsed),
            status: redemption.status,
            notes: redemption.notes,
            user: user ? {
                id: user.id,
                name: [user.firstName, user.lastName].filter(Boolean).join(' '),
                photo: this.resolvePhotoUrl(user.photo),
                email: user.email,
                phone: user.phone,
            } : null,
            withdrawDetails: withdraw ? {
                bankName: withdraw.bankName,
                accountNumber: withdraw.accountNumber,
                accountHolderName: withdraw.accountHolderName,
                payout: Number(withdraw.payout),
                tax: Number(withdraw.tax),
            } : null,
            createdAt: redemption.createdAt,
        }
    }

    static collection(data: Redemption[]) {
        return data.map(redemption => this.single(redemption))
    }
}
