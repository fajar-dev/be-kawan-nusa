import { Context } from 'hono'
import { ServiceService } from './service.service'
import { ApiResponse } from '../../core/helpers/apiResponse'
import { ServiceResource } from './dto/service.resource'

export class ServiceController {
    private service = new ServiceService()

    async index(c: Context) {
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "createdAt"
        const order = c.req.query('order') || "DESC"
        
        const { data, total } = await this.service.getAll(page, limit, q, sort, order)
        
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
        const id = Number(c.req.param('id'))
        const service = await this.service.getById(id)
        return ApiResponse.success(c, ServiceResource.single(service), "Service retrieved successfully")
    }
}
