import { Context } from "hono"
import { UserService } from "./user.service"
import { ApiResponse } from "../../core/helpers/response"
import { UserListSerializer } from "./serializers/user-list.serialize"
import { UserSerializer } from "./serializers/user.serialize"

export class UserController {
    constructor(private readonly service: UserService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"
        const isActive = c.req.query("isActive")

        const { data, total } = await this.service.getAll(page, limit, q, sort, order, { isActive })

        return ApiResponse.paginate(
            c,
            UserListSerializer.collection(data),
            total,
            page,
            limit,
            "User list retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const user = await this.service.getById(id)
        return ApiResponse.success(c, UserSerializer.single(user), "User retrieved successfully")
    }
}
