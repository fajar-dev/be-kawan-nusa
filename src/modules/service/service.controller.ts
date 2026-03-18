import { Context } from 'hono'
import { ServiceService } from './service.service'
import { ApiResponse } from '../../core/helpers/response'
import { CreateServiceRequest, UpdateServiceRequest } from './service.request'
import { ServiceResource } from './service.resource'

export class ServiceController {
    private service = new ServiceService()

    async index(c: Context) {
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        
        const { data, total } = await this.service.getAll(page, limit)
        
        return ApiResponse.paginate(
            c, 
            ServiceResource.collection(data), 
            total, 
            page, 
            limit, 
            "Daftar service berhasil diambil"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param('id'))
        const service = await this.service.getById(id)
        return ApiResponse.success(c, ServiceResource.single(service), "Service berhasil diambil")
    }

    async store(c: Context) {
        const body = await c.req.json() as CreateServiceRequest
        const service = await this.service.create(body)
        return ApiResponse.success(c, ServiceResource.single(service), "Service berhasil dibuat", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param('id'))
        const body = await c.req.json() as UpdateServiceRequest
        const service = await this.service.update(id, body)
        return ApiResponse.success(c, ServiceResource.single(service), "Service berhasil diperbarui")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param('id'))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Service berhasil dihapus")
    }
}
