import { User } from "../../user/entities/user.entity"
import { Employee } from "../../employee/entities/employee.entity"
import minio from "../../../core/helpers/minio"

export class AuthSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(account: User | Employee, role: 'user' | 'admin') {
        if (role === 'admin') {
            const employee = account as Employee
            return {
                id: employee.id,
                name: employee.name,
                photo: employee.photo,
                email: employee.email,
                phone: employee.phone,
                isActive: employee.isActive,
                role,
            }
        }

        const user = account as User
        return {
            id: user.id,
            name: [user.firstName, user.lastName].filter(Boolean).join(' '),
            photo: await this.resolvePhotoUrl(user.photo),
            email: user.email,
            phone: user.phone,
            status: user.status,
            statusNote: user.statusNote,
            isVerified: user.isVerified,
            isBoarding: user.isBoarding,
            role,
        }
    }
}
