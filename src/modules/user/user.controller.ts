import { Context } from "hono"
import { UserService } from "./user.service"
import { ApiResponse } from "../../core/helpers/response"
import { UserListSerializer } from "./serializers/user-list.serialize"
import { UserSerializer } from "./serializers/user.serialize"
import { CustomerServiceService } from "../customer-service/customer-service.service"
import { CustomerServiceSerializer } from "../customer-service/serializers/customer-service.serialize"
import { PointService } from "../point/point.service"
import { PointSerializer } from "../point/serializers/point.serialize"
import { RedemptionService } from "../redemption/redemption.service"
import { RedemptionSerializer } from "../redemption/serializers/redemption.serialize"
import { StatisticService } from "../statistic/statistic.service"

export class UserController {
    constructor(
        private readonly service: UserService,
        private readonly customerServiceService: CustomerServiceService,
        private readonly pointService: PointService,
        private readonly redemptionService: RedemptionService,
        private readonly statisticService: StatisticService,
    ) {}

    async index(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"
        const status = c.req.query("status")

        const { data, total } = await this.service.getAll(page, limit, q, sort, order, { status })

        return ApiResponse.paginate(
            c,
            await UserListSerializer.collection(data),
            total,
            page,
            limit,
            "User list retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const user = await this.service.getById(id)
        return ApiResponse.success(c, await UserSerializer.single(user), "User retrieved successfully")
    }

    async services(c: Context) {
        const userId = Number(c.req.param("id"))
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "referenceDate"
        const order = c.req.query("order") || "DESC"
        const startDate = c.req.query("startDate")
        const endDate = c.req.query("endDate")
        const types = c.req.queries("type[]")
        const serviceCodes = c.req.queries("serviceCode[]")

        const { data, total } = await this.customerServiceService.getAll(userId, page, limit, q, sort, order, {
            startDate,
            endDate,
            types,
            serviceCodes,
        })

        return ApiResponse.paginate(
            c,
            CustomerServiceSerializer.collection(data),
            total,
            page,
            limit,
            "User customer services retrieved successfully"
        )
    }

    async rewards(c: Context) {
        const userId = Number(c.req.param("id"))
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"
        const startDate = c.req.query("startDate")
        const endDate = c.req.query("endDate")
        const types = c.req.queries("type[]")

        const { data, total } = await this.pointService.getAll(userId, page, limit, q, sort, order, {
            startDate,
            endDate,
            types,
        })

        return ApiResponse.paginate(
            c,
            PointSerializer.collection(data),
            total,
            page,
            limit,
            "User rewards retrieved successfully"
        )
    }

    async redemptions(c: Context) {
        const userId = Number(c.req.param("id"))
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"
        const queries = c.req.queries()

        const { data, total } = await this.redemptionService.getAll(
            userId,
            page,
            limit,
            {
                startDate: c.req.query("startDate"),
                endDate: c.req.query("endDate"),
                status: queries["status[]"] || queries["status"],
                type: queries["type[]"] || queries["type"],
                q: c.req.query("q") || "",
            },
            sort,
            order
        )

        return ApiResponse.paginate(
            c,
            await RedemptionSerializer.collection(data),
            total,
            page,
            limit,
            "User redemptions retrieved successfully"
        )
    }

    async statistic(c: Context) {
        const userId = Number(c.req.param("id"))
        const type = c.req.query("type") || "yearly"

        const [count, pointPerMonth, customerStats, redemptionPointStats] = await Promise.all([
            this.statisticService.getCount(userId),
            this.statisticService.getMonthlyPoints(userId),
            this.statisticService.getCustomerStatistics(userId, type),
            this.statisticService.getRedemptionPointStats(userId),
        ])

        return ApiResponse.success(c, {
            count,
            pointPerMonth,
            customerStats,
            redemptionPointStats,
        }, "User statistics retrieved successfully")
    }

    async updateStatus(c: Context) {
        const id = Number(c.req.param("id"))
        const { status, note } = c.req.valid("json" as never)
        const user = await this.service.updateStatus(id, status, note)
        return ApiResponse.success(c, await UserSerializer.single(user), "User status updated successfully")
    }
}
