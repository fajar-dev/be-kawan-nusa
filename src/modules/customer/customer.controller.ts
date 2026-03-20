import { Context } from 'hono'
import { CustomerService } from './customer.service'
import { ApiResponse } from '../../core/helpers/apiResponse'
import { CustomerResource } from './dto/customer.resource'
import { CustomerDetailResource } from './dto/customer-detail.resource'
import { CustomerAddressResource } from './dto/customer-address.resource'

export class CustomerController {
    private service = new CustomerService()

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "activationDate"
        const order = c.req.query('order') || "DESC"
        
        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order)
        
        return ApiResponse.paginate(
            c, 
            CustomerResource.collection(data), 
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
        return ApiResponse.success(c, CustomerDetailResource.single(customer), "Customer retrieved successfully")
    }

    async addresses(c: Context) {
        const user = c.get('user')
        const id = c.req.param('id') as string
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 3
        
        const { data, total } = await this.service.getAddresses(id, user.id, page, limit)
        
        return ApiResponse.paginate(
            c,
            CustomerAddressResource.collection(data), 
            total,
            page,
            limit,
            "Customer addresses retrieved successfully"
        )
    }
}
