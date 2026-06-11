import { Redemption } from "../entities/redemption.entity"
import { minio } from "../../../core/helpers/minio"

export class RedemptionCashListSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(redemption: Redemption) {
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
                photo: await this.resolvePhotoUrl(user.photo),
                email: user.email,
                phone: user.phone,
                identityNumber: user.identityNumber,
                taxNumber: user.taxNumber,
            } : null,
            withdrawDetails: withdraw ? {
                bankName: withdraw.bankName,
                accountNumber: withdraw.accountNumber,
                accountHolderName: withdraw.accountHolderName,
                payout: Number(withdraw.payout),
                tax: Number(withdraw.tax),
                receipt: await this.resolvePhotoUrl(withdraw.receiptPath),
            } : null,
            createdAt: redemption.createdAt,
        }
    }

    static async collection(data: Redemption[]) {
        return Promise.all(data.map(redemption => this.single(redemption)))
    }
}
