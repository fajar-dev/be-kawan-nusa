import { User } from "../../user/entities/user.entity"
import { Employee } from "../../employee/entities/employee.entity"

export class AuthSerializer {
    static single(account: User | Employee, role: 'user' | 'admin') {
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
            photo: user.photo,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            role,
        }
    }
}
