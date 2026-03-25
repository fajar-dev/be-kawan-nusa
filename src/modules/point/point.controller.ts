import { Context } from 'hono'
import { PointService } from './point.service'
import { ApiResponse } from '../../core/helpers/response'
import { PointSerializer } from './serializers/point.serialize'

export class PointController {
    private service: PointService

    constructor() {
        this.service = new PointService()
    }

    async show(c: Context) {
        const user = c.get('user')
        const point = await this.service.getByUserId(user.id)
        return ApiResponse.success(c, PointSerializer.single(point), "Point retrieved successfully")
    }
}
