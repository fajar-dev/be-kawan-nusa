import { Context } from 'hono'
import { CustomerService } from './customer.service'
import { ApiResponse } from '../../core/helpers/response'
import { CreateCustomerRequest, UpdateCustomerRequest } from './customer.request'
import { CustomerResource } from './customer.resource'

export class CustomerController {
    private service = new CustomerService()

    async index(c: Context) {
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        
        const { data, total } = await this.service.getAll(page, limit)
        
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
        const id = c.req.param('id') as string
        const customer = await this.service.getById(id)
        return ApiResponse.success(c, CustomerResource.single(customer), "Customer retrieved successfully")
    }

    async store(c: Context) {
        const body = await c.req.json() as CreateCustomerRequest
        const customer = await this.service.create(body)
        return ApiResponse.success(c, CustomerResource.single(customer), "Customer created successfully", 201)
    }

    async update(c: Context) {
        const id = c.req.param('id') as string
        const body = await c.req.json() as UpdateCustomerRequest
        const customer = await this.service.update(id, body)
        return ApiResponse.success(c, CustomerResource.single(customer), "Customer updated successfully")
    }

    async destroy(c: Context) {
        const id = c.req.param('id') as string
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Customer deleted successfully")
    }
}
