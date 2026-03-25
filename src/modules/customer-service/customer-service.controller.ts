import { Context } from 'hono'
import { CustomerServiceService } from './customer-service.service'
import { ApiResponse } from '../../core/helpers/response'
import { CustomerServiceSerializer } from './serializers/customer-service.serialize'

export class CustomerServiceController {
    private customerService: CustomerServiceService

    constructor() {
        this.customerService = new CustomerServiceService()
    }

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "referenceDate"
        const order = c.req.query('order') || "DESC"
        
        const { data, total } = await this.customerService.getAll(user.id, page, limit, q, sort, order)
        
        return ApiResponse.paginate(
            c, 
            CustomerServiceSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Customer services retrieved successfully"
        )
    }

    async byCustomer(c: Context) {
        const user = c.get('user')
        const customerId = c.req.param('id') as string
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "referenceDate"
        const order = c.req.query('order') || "DESC"
        
        const { data, total } = await this.customerService.getAllByCustomer(customerId, user.id, page, limit, q, sort, order)
        
        return ApiResponse.paginate(
            c, 
            CustomerServiceSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Customer services retrieved successfully"
        )
    }

    async byService(c: Context) {
        const user = c.get('user')
        const serviceCode = c.req.param('code') as string
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "referenceDate"
        const order = c.req.query('order') || "DESC"
        
        const { data, total } = await this.customerService.getAllByService(serviceCode, user.id, page, limit, q, sort, order)
        
        return ApiResponse.paginate(
            c, 
            CustomerServiceSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Customer services retrieved successfully"
        )
    }
}
