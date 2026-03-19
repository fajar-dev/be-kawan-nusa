import { User } from "./user.entity"

export class UserResource {
    static single(user: User) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            photo: user.photo,
            email: user.email,
            phone: user.phone,
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
            }
        }
    }

    static collection(users: User[]) {
        return users.map(user => this.single(user))
    }
}
