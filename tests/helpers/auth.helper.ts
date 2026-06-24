import { sign } from "hono/jwt"
import { config } from "../../src/config/config"
import { AppDataSource } from "../../src/config/database"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"
import { hashPassword } from "../../src/core/helpers/hash"

export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
    const repo = AppDataSource.getRepository(User)
    const user = repo.create({
        firstName: "Test",
        lastName: "User",
        email: `test-${Date.now()}@example.com`,
        phone: `08${Date.now().toString().slice(-10)}`,
        password: await hashPassword("password123"),
        isActive: true,
        isVerified: true,
        ...overrides,
    })
    return await repo.save(user)
}

export async function createTestAdmin(overrides: Partial<Employee> = {}): Promise<Employee> {
    const repo = AppDataSource.getRepository(Employee)
    const employee = repo.create({
        name: "Test Admin",
        email: `admin-${Date.now()}@nusanet.id`,
        isActive: true,
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
        await AppDataSource.getRepository(Employee).delete(employeeId)
    } catch (_) {}
}
