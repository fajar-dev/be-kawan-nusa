export class RoleSerializer {
    static single(role: any, employeeCount?: number, employees?: any[]) {
        return {
            id: role.id,
            name: role.name,
            description: role.description || null,
            color: role.color || null,
            permissions: role.permissions || {},
            isDefault: role.isDefault || false,
            employeeCount: employeeCount ?? role.employeeCount ?? 0,
            employees: employees ? employees.map(emp => ({
                id: emp.id,
                name: emp.name,
                email: emp.email,
                photo: emp.photo || null,
            })) : undefined,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        }
    }

    static collection(roles: any[]) {
        return roles.map(role => this.single(role))
    }
}
