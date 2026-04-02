import { Context } from 'hono'
import { RedemptionService } from './redemption.service'
import { ApiResponse } from '../../core/helpers/response'
import { RedemptionSerializer } from './serializers/redemption.serialize'
import { generateWithdrawalNote } from '../../core/helpers/pdf'

export class RedemptionController {
    private service: RedemptionService

    constructor() {
        this.service = new RedemptionService()
    }

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10

        const { data, total } = await this.service.getAll(user.id, page, limit)

        return ApiResponse.paginate(
            c,
            RedemptionSerializer.collection(data),
            total,
            page,
            limit,
            "Redemptions retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get('user')
        const id = Number(c.req.param('id'))
        const data = await this.service.getById(id, user.id)
        return ApiResponse.success(c, RedemptionSerializer.single(data), "Redemption details retrieved successfully")
    }

    async store(c: any) {
        const user = c.get('user')
        const body = c.req.valid('json')
        
        try {
            const data = await this.service.create(user.id, body)
            return ApiResponse.success(c, RedemptionSerializer.single(data as any), "Redemption created successfully")
        } catch (error: any) {
            return ApiResponse.error(c, error.message || "Failed to create redemption", 400)
        }
    }

    async downloadReceipt(c: Context) {
        const user = c.get('user')
        const id = Number(c.req.param('id'))

        try {
            const redemption = await this.service.getById(id, user.id)
            const pdfBuffer = await generateWithdrawalNote(redemption)
            
            c.header('Content-Type', 'application/pdf')
            c.header('Content-Disposition', `attachment; filename="redemption-${redemption.redempNo}.pdf"`)
            return c.body(pdfBuffer as any)
        } catch (error: any) {
            return ApiResponse.error(c, error.message || "Failed to generate PDF", 400)
        }
    }
}
