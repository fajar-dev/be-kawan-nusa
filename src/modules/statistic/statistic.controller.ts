import { Context } from 'hono'
import { StatisticService } from './statistic.service'
import { ApiResponse } from '../../core/helpers/response'

export class StatisticController {
    private service: StatisticService

    constructor() {
        this.service = new StatisticService()
    }

    async count(c: Context) {
        const user = c.get('user')
        const data = await this.service.getCount(user.id)
        return ApiResponse.success(c, data, "Statistic count retrieved successfully")
    }

    async pointPerMonth(c: Context) {
        const user = c.get('user')
        const data = await this.service.getMonthlyPoints(user.id)
        return ApiResponse.success(c, data, "Monthly point statistics retrieved successfully")
    }
}
