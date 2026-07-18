import { Context } from "hono"
import { PointSubmissionService } from "./point-submission.service"
import { ApiResponse } from "../../core/helpers/response"
import { PointSubmissionSerializer } from "./serializers/point-submission.serialize"
import { PointSubmissionScheduleSerializer } from "./serializers/point-submission-schedule.serialize"
import { PointSubmissionStatus } from "./point-submission.enum"
import { NisHelper } from "../../core/helpers/nis"

export class PointSubmissionController {
    constructor(
        private readonly service: PointSubmissionService,
        private readonly nisHelper: NisHelper,
    ) {}

    async index(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"
        const status = c.req.query("status") as PointSubmissionStatus | undefined
        const type = c.req.query("type")
        const startDate = c.req.query("startDate")
        const endDate = c.req.query("endDate")

        const { data, total } = await this.service.getAll(page, limit, q, sort, order, {
            status, type, startDate, endDate,
        })

        return ApiResponse.paginate(c, PointSubmissionSerializer.collection(data), total, page, limit, "Point submissions retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const data = await this.service.getById(id)
        return ApiResponse.success(c, PointSubmissionSerializer.single(data), "Point submission retrieved successfully")
    }

    async store(c: Context) {
        const user = c.get("user")
        const body = await c.req.json()
        const data = await this.service.create({
            ...body,
            createdById: user.id,
            status: PointSubmissionStatus.PENDING,
        })
        return ApiResponse.success(c, PointSubmissionSerializer.single(data), "Point submission created successfully", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const body = await c.req.json()
        const data = await this.service.update(id, body)
        return ApiResponse.success(c, PointSubmissionSerializer.single(data), "Point submission updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Point submission deleted successfully")
    }

    async approve(c: Context) {
        const user = c.get("user")
        const body = await c.req.json()
        await this.service.approve(body.ids, user.id, body.notes)
        return ApiResponse.success(c, null, "Point submissions approved successfully")
    }

    async schedules(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const isActiveParam = c.req.query("isActive")
        const isActive = isActiveParam === undefined ? undefined : isActiveParam === "true"

        const { data, total } = await this.service.getSchedules(page, limit, isActive)
        return ApiResponse.paginate(c, PointSubmissionScheduleSerializer.collection(data), total, page, limit, "Schedules retrieved successfully")
    }

    async stopSchedule(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        await this.service.stopSchedule(id, user.id)
        return ApiResponse.success(c, null, "Schedule stopped successfully")
    }

    async checkAccount(c: Context) {
        const custServId = Number(c.req.query("custServId"))
        const userId = Number(c.req.query("userId"))
        const excludeId = c.req.query("excludeId") ? Number(c.req.query("excludeId")) : undefined

        if (!custServId || isNaN(custServId)) {
            return ApiResponse.error(c, "custServId is required", 400)
        }

        if (!userId || isNaN(userId)) {
            return ApiResponse.error(c, "userId is required", 400)
        }

        const result = await this.service.checkAccountExists(custServId, userId, excludeId)
        return ApiResponse.success(c, result, "Account check completed")
    }

    async searchNisAccounts(c: Context) {
        const q = c.req.query("q") || ""
        if (q.length < 2) {
            return ApiResponse.success(c, [], "Search query too short")
        }
        const data = await this.nisHelper.searchAccounts(q)
        return ApiResponse.success(c, data, "NIS accounts retrieved successfully")
    }
}
