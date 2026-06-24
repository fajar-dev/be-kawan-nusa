import { User } from "../entities/user.entity"
import { minio } from "../../../core/helpers/minio"

export class UserSerializer {
    private static async resolveFileUrl(path?: string | null): Promise<string | null> {
        if (!path) return null
        return await minio.getPresignedUrl(path)
    }

    static async single(user: User) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            photo: await this.resolveFileUrl(user.photo),
            email: user.email,
            phone: user.phone,
            hasWhatsapp: user.hasWhatsapp,
            identityNumber: user.identityNumber,
            taxNumber: user.taxNumber,
            company: user.company,
            jobPosition: user.jobPosition,
            birthDate: user.birthDate,
            birthPlace: user.birthPlace,
            address: user.address,
            companyAddress: user.companyAddress,
            identityPath: await this.resolveFileUrl(user.identityPath),
            bankDetails: {
                holderName: user.accountHolderName,
                name: user.bankName,
                number: user.accountNumber,
                accountPath: await this.resolveFileUrl(user.accountPath),
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
