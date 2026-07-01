import { Context } from "hono"
import { StatisticService } from "./statistic.service"
import { ApiResponse } from "../../core/helpers/response"

export class StatisticController {
    constructor(private readonly service: StatisticService) {}

    async count(c: Context) {
        const user = c.get("user")
        const data = await this.service.getCount(user.id)
        return ApiResponse.success(c, data, "Statistic count retrieved successfully")
    }

    async adminSummary(c: Context) {
        const data = await this.service.getAdminSummary()
        return ApiResponse.success(c, data, "Admin summary statistic retrieved successfully")
    }

    async pointPerMonth(c: Context) {
        const user = c.get("user")
        const data = await this.service.getMonthlyPoints(user.id)
        return ApiResponse.success(c, data, "Monthly point statistics retrieved successfully")
    }

    async customerStats(c: Context) {
        const user = c.get("user")
        const type = c.req.query("type") || "yearly"
        const data = await this.service.getCustomerStatistics(user.id, type)
        return ApiResponse.success(c, data, `Customer ${type} statistics retrieved successfully`)
    }

    async redemptionPointStats(c: Context) {
        const user = c.get("user")
        const data = await this.service.getRedemptionPointStats(user.id)
        return ApiResponse.success(c, data, "Redemption point statistics retrieved successfully")
    }
}
