import { User } from "../../user/entities/user.entity"

export class AuthSerializer {
    static single(user: User) {
        return {
            id: user.id,
            name: [user.firstName, user.lastName].filter(Boolean).join(' '),
            photo: user.photo,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
        }
    }
}
