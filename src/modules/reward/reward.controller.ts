import { Context } from 'hono'
import { RewardService } from './reward.service'
import { ApiResponse } from '../../core/helpers/response'
import { RewardResource } from './dto/reward.resource'

export class RewardController {
    private service: RewardService

    constructor() {
        this.service = new RewardService()
    }

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "createdAt"
        const order = c.req.query('order') || "DESC"

        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order)

        return ApiResponse.paginate(
            c, 
            RewardResource.collection(data), 
            total, 
            page, 
            limit, 
            "Rewards retrieved successfully"
        )
    }

    async byCustomer(c: Context) {
        const user = c.get('user')
        const customerId = c.req.param('id') as string
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        const sort = c.req.query('sort') || "createdAt"
        const order = c.req.query('order') || "DESC"

        const { data, total } = await this.service.getByCustomerId(customerId, user.id, page, limit, q, sort, order)

        return ApiResponse.paginate(
            c, 
            RewardResource.collection(data), 
            total, 
            page, 
            limit, 
            "Customer rewards retrieved successfully"
        )
    }
}
