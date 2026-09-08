import { Context } from "hono"
import { PointAdjustmentService } from "./point-adjustment.service"
import { ApiResponse } from "../../core/helpers/response"
import { PointAdjustmentSerializer } from "./serializers/point-adjustment.serialize"
import { CreatePointAdjustmentValidator, ReviewPointAdjustmentValidator, ResubmitPointAdjustmentValidator } from "./validators/point-adjustment.validator"

export class PointAdjustmentController {
    constructor(private readonly service: PointAdjustmentService) {}

    async eligibleSubmissions(c: Context) {
        const admin = c.get("user")
        const data = await this.service.getEligibleSubmissions(admin.id)
        return ApiResponse.success(c, data.map(PointAdjustmentSerializer.eligibleSubmission), "Eligible point submissions retrieved successfully")
    }

    async counts(c: Context) {
        const admin = c.get("user")
        const data = await this.service.getCounts(admin.id)
        return ApiResponse.success(c, data, "Point adjustment counts retrieved successfully")
    }

    async index(c: Context) {
        const admin = c.get("user")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const tab = c.req.query("tab") || undefined

        const { data, total } = await this.service.getList(admin.id, page, limit, q, tab)
        return ApiResponse.paginate(c, PointAdjustmentSerializer.collection(data), total, page, limit, "Point adjustments retrieved successfully")
    }

    async show(c: Context) {
        const admin = c.get("user")
        const id = Number(c.req.param("id"))
        const result = await this.service.getById(id, admin.id)
        return ApiResponse.success(c, PointAdjustmentSerializer.single(result), "Point adjustment retrieved successfully")
    }

    async store(c: Context) {
        const admin = c.get("user")
        const body = CreatePointAdjustmentValidator.parse(await c.req.json())
        const result = await this.service.create(body.pointSubmissionId, body.toValue, body.reason, admin.id)
        return ApiResponse.success(c, PointAdjustmentSerializer.single(result), "Point adjustment submitted successfully")
    }

    async review(c: Context) {
        const admin = c.get("user")
        const id = Number(c.req.param("id"))
        const body = ReviewPointAdjustmentValidator.parse(await c.req.json())
        const result = await this.service.review(id, body.action, body.note || null, admin.id)
        return ApiResponse.success(c, PointAdjustmentSerializer.single(result), "Point adjustment reviewed successfully")
    }

    async resubmit(c: Context) {
        const admin = c.get("user")
        const id = Number(c.req.param("id"))
        const body = ResubmitPointAdjustmentValidator.parse(await c.req.json())
        const result = await this.service.resubmit(id, body.toValue, body.reason, admin.id)
        return ApiResponse.success(c, PointAdjustmentSerializer.single(result), "Point adjustment resubmitted successfully")
    }
}
