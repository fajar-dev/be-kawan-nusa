import { Context } from 'hono'
import { RewardService } from './reward.service'
import { ApiResponse } from '../../core/helpers/response'
import { RewardSerializer } from './serializers/reward.serialize'

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
        const startDate = c.req.query('startDate')
        const endDate = c.req.query('endDate')

        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order, startDate, endDate)

        return ApiResponse.paginate(
            c, 
            RewardSerializer.collection(data), 
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
            RewardSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Customer rewards retrieved successfully"
        )
    }

    async store(c: Context) {
        const body = await c.req.json()
        const data = await this.service.create(body)
        return ApiResponse.success(c, RewardSerializer.single(data), "Reward created successfully")
    }
}
