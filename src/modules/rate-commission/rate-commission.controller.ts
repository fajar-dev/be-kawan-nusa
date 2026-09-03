import { Context } from "hono"
import { RateCommissionService } from "./rate-commission.service"
import { ApiResponse } from "../../core/helpers/response"
import { RateCommissionSerializer } from "./serializers/rate-commission.serialize"
import { RateCommissionHistorySerializer } from "./serializers/rate-commission-history.serialize"
import { PointType } from "../point/point.enum"
import { RateCommissionValueType } from "./rate-commission.enum"
import { CreateRateCommissionValidator, UpdateRateCommissionValidator } from "./validators/rate-commission.validator"

export class RateCommissionController {
    constructor(private readonly service: RateCommissionService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"
        const category = c.req.query("category") as PointType | undefined
        const type = c.req.query("type") as RateCommissionValueType | undefined
        const startDateFrom = c.req.query("startDateFrom")
        const startDateTo = c.req.query("startDateTo")

        const { data, total } = await this.service.getAll(page, limit, q, sort, order, { category, type, startDateFrom, startDateTo })
        return ApiResponse.paginate(c, RateCommissionSerializer.collection(data), total, page, limit, "Rate commissions retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const item = await this.service.getById(id)
        return ApiResponse.success(c, RateCommissionSerializer.single(item), "Rate commission retrieved successfully")
    }

    async takenServices(c: Context) {
        const category = c.req.query("category") as PointType
        const codes = await this.service.getTakenServiceCodes(category)
        return ApiResponse.success(c, codes, "Taken service codes retrieved successfully")
    }

    async store(c: Context) {
        const admin = c.get("user")
        const body = await c.req.json() as CreateRateCommissionValidator
        const item = await this.service.create(body, admin.id)
        return ApiResponse.success(c, RateCommissionSerializer.single(item), "Rate commission created successfully")
    }

    async update(c: Context) {
        const admin = c.get("user")
        const id = Number(c.req.param("id"))
        const body = await c.req.json() as UpdateRateCommissionValidator
        const item = await this.service.update(id, body, admin.id)
        return ApiResponse.success(c, RateCommissionSerializer.single(item), "Rate commission updated successfully")
    }

    async histories(c: Context) {
        const id = Number(c.req.param("id"))
        const data = await this.service.getHistories(id)
        return ApiResponse.success(c, RateCommissionHistorySerializer.collection(data), "Rate commission histories retrieved successfully")
    }

    async allHistories(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""

        const { data, total } = await this.service.getAllHistories(page, limit, q)
        return ApiResponse.paginate(c, RateCommissionHistorySerializer.collection(data), total, page, limit, "Rate commission histories retrieved successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Rate commission deleted successfully")
    }
}
