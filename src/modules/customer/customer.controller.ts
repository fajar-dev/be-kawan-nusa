import { Context } from 'hono'
import { CustomerService } from './customer.service'
import { ApiResponse } from '../../core/helpers/response'
import { CustomerSerializer } from './serializers/customer.serialize'
import { CustomerDetailSerializer } from './serializers/customer-detail.serialize'


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
        const sort = c.req.query('sort') || "registrationDate"
        const order = c.req.query('order') || "DESC"
        const isActive = c.req.query('isActive')
        const types = c.req.queries('type[]')
        const serviceCodes = c.req.queries('serviceCode[]')

        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order, { types, isActive, serviceCodes })
        
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
}
