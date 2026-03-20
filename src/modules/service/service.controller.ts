import { Context } from 'hono'
import { ServiceService } from './service.service'
import { ApiResponse } from '../../core/helpers/apiResponse'
import { ServiceResource } from './dto/service.resource'

export class ServiceController {
    private service = new ServiceService()

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "name"
        const order = c.req.query('order') || "ASC"
        
        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order)
        
        return ApiResponse.paginate(
            c, 
            ServiceResource.collection(data), 
            total, 
            page, 
            limit, 
            "Service list retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get('user')
        const code = c.req.param('code') as string
        const service = await this.service.getByCode(code, user.id)
        return ApiResponse.success(c, ServiceResource.single(service), "Service retrieved successfully")
    }
}
