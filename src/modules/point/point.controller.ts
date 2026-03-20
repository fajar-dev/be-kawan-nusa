import { Context } from 'hono'
import { PointService } from './point.service'
import { ApiResponse } from '../../core/helpers/apiResponse'
import { PointResource } from './dto/point.resource'

export class PointController {
    private service = new PointService()

    async show(c: Context) {
        const user = c.get('user')
        const point = await this.service.getByUserId(user.id)
        return ApiResponse.success(c, PointResource.single(point), "Point retrieved successfully")
    }
}
