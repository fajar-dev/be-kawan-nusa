import { Context } from 'hono'
import { WithdrawService } from './withdraw.service'
import { ApiResponse } from '../../core/helpers/response'
import { WithdrawResource } from './dto/withdraw.resource'

export class WithdrawController {
    private service: WithdrawService

    constructor() {
        this.service = new WithdrawService()
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
            WithdrawResource.collection(data), 
            total, 
            page, 
            limit, 
            "Withdrawal list retrieved successfully"
        )
    }

    async store(c: Context) {
        const user = c.get('user')
        const body = await c.req.json()
        
        const data = await this.service.create({
            ...body,
            userId: user.id,
            bankName: user.bankName,
            accountNumber: user.accountNumber,
            accountHolderName: user.accountHolderName
        })
        
        return ApiResponse.success(c, WithdrawResource.single(data), "Withdrawal requested successfully")
    }
}
