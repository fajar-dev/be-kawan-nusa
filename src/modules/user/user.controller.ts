import { Context } from 'hono'
import { UserService } from './user.service'
import { ApiResponse } from '../../core/helpers/response'
import { CreateUserRequest, UpdateUserRequest } from './user.request'
import { UserResource } from './user.resource'

export class UserController {
    private service = new UserService()

    async index(c: Context) {
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        
        const { data, total } = await this.service.getAll(page, limit)
        
        return ApiResponse.paginate(
            c, 
            UserResource.collection(data), 
            total, 
            page, 
            limit, 
            "User list retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = c.req.param('id') as string
        const user = await this.service.getById(id)
        return ApiResponse.success(c, UserResource.single(user), "User retrieved successfully")
    }

    async store(c: Context) {
        const body = await c.req.json() as CreateUserRequest
        const user = await this.service.create(body)
        return ApiResponse.success(c, UserResource.single(user), "User created successfully", 201)
    }

    async update(c: Context) {
        const id = c.req.param('id') as string
        const body = await c.req.json() as UpdateUserRequest
        const user = await this.service.update(id, body)
        return ApiResponse.success(c, UserResource.single(user), "User updated successfully")
    }

    async destroy(c: Context) {
        const id = c.req.param('id') as string
        await this.service.delete(id)
        return ApiResponse.success(c, null, "User deleted successfully")
    }
}
