import { Context } from 'hono'
import { ServicePromotionService } from './service-promotion.service'
import { ApiResponse } from '../../core/helpers/response'
import { ServicePromotionSerializer } from './serializers/service-promotion.serialize'

export class ServicePromotionController {
    private service: ServicePromotionService

    constructor() {
        this.service = new ServicePromotionService()
    }

    async index(c: Context) {
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        
        const { data, total } = await this.service.getAll(page, limit, q)
        
        return ApiResponse.paginate(
            c, 
            ServicePromotionSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Service promotions retrieved successfully"
        )
    }
}
