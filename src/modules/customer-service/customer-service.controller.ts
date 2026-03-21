import { Context } from 'hono'
import { CustomerServiceService } from './customer-service.service'
import { ApiResponse } from '../../core/helpers/response'
import { CustomerServiceResource } from './dto/customer-service.resource'

export class CustomerServiceController {
    private service: CustomerServiceService

    constructor() {
        this.service = new CustomerServiceService()
    }

    async byCustomer(c: Context) {
        const user = c.get('user')
        const customerId = c.req.param('id') as string
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "referenceDate"
        const order = c.req.query('order') || "DESC"
        
        const { data, total } = await this.service.getAllByCustomer(customerId, user.id, page, limit, q, sort, order)
        
        return ApiResponse.paginate(
            c, 
            CustomerServiceResource.collection(data), 
            total, 
            page, 
            limit, 
            "Customer services retrieved successfully"
        )
    }
}
