import { Context } from "hono"
import { RoleService } from "./role.service"
import { ApiResponse } from "../../core/helpers/response"
import { RoleSerializer } from "./serializers/role.serialize"

export class RoleController {
    constructor(private readonly service: RoleService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || undefined

        const { data, total } = await this.service.getAll(page, limit, q)

        const serialized = data.map(({ role, employeeCount }) =>
            RoleSerializer.single(role, employeeCount)
        )

        return ApiResponse.paginate(c, serialized, total, page, limit, "Roles retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const role = await this.service.getById(id)
        return ApiResponse.success(c, RoleSerializer.single(role, role.employeeCount, role.employees), "Role retrieved successfully")
    }

    async store(c: Context) {
        const body = await c.req.json()
        const role = await this.service.create(body)
        return ApiResponse.success(c, RoleSerializer.single(role), "Role created successfully", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const body = await c.req.json()
        const role = await this.service.update(id, body)
        return ApiResponse.success(c, RoleSerializer.single(role), "Role updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Role deleted successfully")
    }

    async permissionMatrix(c: Context) {
        const matrix = this.service.getPermissionMatrix()
        return ApiResponse.success(c, matrix, "Permission matrix retrieved successfully")
    }

    async employees(c: Context) {
        const employees = await this.service.getAllEmployees()
        const serialized = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            email: emp.email,
            photo: emp.photo || null,
            roleId: emp.roleId || null,
        }))
        return ApiResponse.success(c, serialized, "Employees retrieved successfully")
    }
}
