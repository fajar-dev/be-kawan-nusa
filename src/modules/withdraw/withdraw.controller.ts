import { Context } from 'hono'
import { WithdrawService } from './withdraw.service'
import { ApiResponse } from '../../core/helpers/response'
import { WithdrawSerializer } from './serializers/withdraw.serialize'
import { generateWithdrawalNote } from '../../core/helpers/pdf'

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
        const startDate = c.req.query('startDate')
        const endDate = c.req.query('endDate')
        
        const { data, total } = await this.service.getAll(user.id, page, limit, q, sort, order, startDate, endDate)
        
        return ApiResponse.paginate(
            c, 
            WithdrawSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Withdrawal list retrieved successfully"
        )
    }

    async receipt(c: Context, disposition: 'inline' | 'attachment' = 'inline') {
        const user = c.get('user')
        const idRaw = c.req.param('id') || ""
        const id = Number(idRaw.replace('.pdf', ''))
        
        const withdraw = await this.service.getById(id, user.id)
        
        const pdfBuffer = await generateWithdrawalNote(withdraw)
        
        return c.body(pdfBuffer as any, 200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `${disposition}; filename="paid-${withdraw.id}.pdf"`
        })
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
        
        return ApiResponse.success(c, WithdrawSerializer.single(data), "Withdrawal requested successfully")
    }
}
