import { User } from "../entities/user.entity"
import { minio } from "../../../core/helpers/minio"

export class UserSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(user: User) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            photo: await this.resolvePhotoUrl(user.photo),
            email: user.email,
            phone: user.phone,
            identityNumber: user.identityNumber,
            taxNumber: user.taxNumber,
            company: user.company,
            jobPosition: user.jobPosition,
            bankDetails: {
                holderName: user.accountHolderName,
                name: user.bankName,
                number: user.accountNumber
            },
            settings: {
                isSubscribe: user.isSubscribe,
                isAutoWithdraw: user.isAutoWithdraw
            },
            isActive: user.isActive,
            passwordUpdatedAt: user.passwordUpdatedAt,
            createdAt: user.createdAt
        }
    }

    static async collection(users: User[]) {
        return Promise.all(users.map(user => this.single(user)))
    }
}
