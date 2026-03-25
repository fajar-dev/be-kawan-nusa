import { Context } from 'hono'
import { CustomerService } from './customer.service'
import { ApiResponse } from '../../core/helpers/response'
import { CustomerSerializer } from './serializers/customer.serialize'
import { CustomerDetailSerializer } from './serializers/customer-detail.serialize'
import { CustomerAddressSerializer } from './serializers/customer-address.serialize'

export class CustomerController {
    private service: CustomerService

    constructor() {
        this.service = new CustomerService()
    }

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "activationDate"
        const order = c.req.query('order') || "DESC"
        
        const startDate = c.req.query('startDate')
        const endDate = c.req.query('endDate')
        const isActive = c.req.query('isActive')
        const types = c.req.queries('type[]')
        const serviceCodes = c.req.queries('serviceCode[]')

        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order, { startDate, endDate, types, isActive, serviceCodes })
        
        return ApiResponse.paginate(
            c, 
            CustomerSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Customer list retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get('user')
        const id = c.req.param('id') as string
        const customer = await this.service.getById(id, user.id)
        return ApiResponse.success(c, CustomerDetailSerializer.single(customer), "Customer retrieved successfully")
    }

    async addresses(c: Context) {
        const user = c.get('user')
        const id = c.req.param('id') as string
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 3
        
        const { data, total } = await this.service.getAddresses(id, user.id, page, limit)
        
        return ApiResponse.paginate(
            c,
            CustomerAddressSerializer.collection(data), 
            total,
            page,
            limit,
            "Customer addresses retrieved successfully"
        )
    }
}
