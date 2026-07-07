import { sign } from "hono/jwt"
import { config } from "../../src/config/config"
import { AppDataSource } from "../../src/config/database"
import { User } from "../../src/modules/user/entities/user.entity"
import { UserStatus } from "../../src/modules/user/user.enum"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { Role } from "../../src/modules/role/entities/role.entity"
import { hashPassword } from "../../src/core/helpers/hash"

const ALL_ACTIONS = ["L", "T", "E", "H"]

const FULL_PERMISSIONS: Record<string, string[]> = {
    dashboard: ALL_ACTIONS,
    user: ALL_ACTIONS,
    "user.approval": ALL_ACTIONS,
    "point-submission": ALL_ACTIONS,
    "point-submission.history": ALL_ACTIONS,
    "point-submission.request": ALL_ACTIONS,
    "redemption.cash": ALL_ACTIONS,
    "redemption.product": ALL_ACTIONS,
    "redemption.voucher": ALL_ACTIONS,
    catalog: ALL_ACTIONS,
    education: ALL_ACTIONS,
    employee: ALL_ACTIONS,
    role: ALL_ACTIONS,
}

export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
    const repo = AppDataSource.getRepository(User)
    const user = repo.create({
        firstName: "Test",
        lastName: "User",
        email: `test-${Date.now()}@example.com`,
        phone: `08${Date.now().toString().slice(-10)}`,
        password: await hashPassword("password123"),
        status: UserStatus.ACTIVE,
        isVerified: true,
        ...overrides,
    })
    return await repo.save(user)
}

export async function createTestAdmin(overrides: Partial<Employee> = {}): Promise<Employee> {
    const roleRepo = AppDataSource.getRepository(Role)
    const role = roleRepo.create({
        name: `TestRole-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        permissions: FULL_PERMISSIONS,
    })
    const savedRole = await roleRepo.save(role)

    const repo = AppDataSource.getRepository(Employee)
    const employee = repo.create({
        name: "Test Admin",
        email: `admin-${Date.now()}@nusanet.id`,
        employeeId: `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isActive: true,
        roleId: savedRole.id,
        ...overrides,
    })
    return await repo.save(employee)
}

export async function createTestAdminNoPermissions(overrides: Partial<Employee> = {}): Promise<Employee> {
    const roleRepo = AppDataSource.getRepository(Role)
    const role = roleRepo.create({
        name: `TestRoleNoPerm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        permissions: {},
    })
    const savedRole = await roleRepo.save(role)

    const repo = AppDataSource.getRepository(Employee)
    const employee = repo.create({
        name: "Test Admin No Perm",
        email: `admin-noperm-${Date.now()}@nusanet.id`,
        employeeId: `TEST-NP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isActive: true,
        roleId: savedRole.id,
        ...overrides,
    })
    return await repo.save(employee)
}

export async function generateUserToken(user: User): Promise<string> {
    return await sign(
        { sub: user.id, email: user.email, role: "user", exp: Math.floor(Date.now() / 1000) + 60 * 15 },
        config.app.jwtSecret,
        "HS256"
    )
}

export async function generateAdminToken(employee: Employee): Promise<string> {
    return await sign(
        { sub: employee.id, email: employee.email, role: "admin", exp: Math.floor(Date.now() / 1000) + 60 * 15 },
        config.app.jwtSecret,
        "HS256"
    )
}

export async function cleanupTestUser(userId: number): Promise<void> {
    try {
        await AppDataSource.getRepository(User).delete(userId)
    } catch (_) {}
}

export async function cleanupTestAdmin(employeeId: number): Promise<void> {
    try {
        const employeeRepo = AppDataSource.getRepository(Employee)
        const employee = await employeeRepo.findOneBy({ id: employeeId })
        const roleId = employee?.roleId
        await employeeRepo.delete(employeeId)
        if (roleId) {
            await AppDataSource.getRepository(Role).delete(roleId)
        }
    } catch (_) {}
}
