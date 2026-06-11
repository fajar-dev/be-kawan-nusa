import { Context } from "hono"
import { RedemptionService } from "./redemption.service"
import { ApiResponse } from "../../core/helpers/response"
import { RedemptionSerializer } from "./serializers/redemption.serialize"
import { RedemptionCashListSerializer } from "./serializers/redemption-cash-list.serialize"

export class RedemptionController {
    constructor(private readonly service: RedemptionService) {}

    async cashList(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"

        const queries = c.req.queries()

        const { data, total } = await this.service.getCashList(
            page,
            limit,
            {
                startDate: c.req.query("startDate"),
                endDate: c.req.query("endDate"),
                status: queries["status[]"] || queries["status"],
                q: c.req.query("q") || "",
            },
            sort,
            order
        )

        return ApiResponse.paginate(
            c,
            await RedemptionCashListSerializer.collection(data),
            total,
            page,
            limit,
            "Cash redemptions retrieved successfully"
        )
    }

    async index(c: Context) {
        const user = c.get("user")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"

        const queries = c.req.queries()

        const { data, total } = await this.service.getAll(
            user.id,
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
            "Redemptions retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        const data = await this.service.getById(id, user.id)
        return ApiResponse.success(c, await RedemptionSerializer.single(data), "Redemption details retrieved successfully")
    }

    async storeCash(c: any) {
        const user = c.get("user")
        const body = c.req.valid("json")

        try {
            const data = await this.service.createCash(user.id, body.pointsUsed, body.notes)
            return ApiResponse.success(c, await RedemptionSerializer.single(data), "Cash redemption created successfully")
        } catch (error: any) {
            return ApiResponse.error(c, error.message || "Failed to create cash redemption", 400)
        }
    }

    async storeVoucher(c: any) {
        const user = c.get("user")
        const body = c.req.valid("json")

        try {
            const data = await this.service.createVoucher(user.id, body.catalogId, body.notes)
            return ApiResponse.success(c, await RedemptionSerializer.single(data), "Voucher redemption created successfully")
        } catch (error: any) {
            return ApiResponse.error(c, error.message || "Failed to create voucher redemption", 400)
        }
    }

    async storeProduct(c: any) {
        const user = c.get("user")
        const body = c.req.valid("json")

        try {
            const data = await this.service.createProduct(user.id, body.catalogId, body.address, body.notes)
            return ApiResponse.success(c, await RedemptionSerializer.single(data), "Product redemption created successfully")
        } catch (error: any) {
            return ApiResponse.error(c, error.message || "Failed to create product redemption", 400)
        }
    }

    async completeCash(c: any) {
        const id = Number(c.req.param("id"))

        try {
            const data = await this.service.completeCash(id)
            return ApiResponse.success(c, await RedemptionSerializer.single(data), "Redemption marked as completed successfully")
        } catch (error: any) {
            return ApiResponse.error(c, error.message || "Failed to complete redemption", 400)
        }
    }
}
