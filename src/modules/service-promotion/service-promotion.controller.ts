import { Context } from "hono"
import { ServicePromotionService } from "./service-promotion.service"
import { ApiResponse } from "../../core/helpers/response"
import { ServicePromotionSerializer } from "./serializers/service-promotion.serialize"
import { NotFoundException } from "../../core/exceptions/base"
import { CreateServicePromotionValidator, UpdateServicePromotionValidator } from "./validators/service-promotion.validator"

export class ServicePromotionController {
    constructor(private readonly service: ServicePromotionService) {}

    async index(c: Context) {
        const role = c.get("role")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""

        const { data, total } = await this.service.getAll(page, limit, q, role === "admin")

        return ApiResponse.paginate(
            c,
            await ServicePromotionSerializer.collection(data),
            total,
            page,
            limit,
            "Service promotions retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const promotion = await this.service.getById(id)
        if (!promotion) {
            throw new NotFoundException("Service promotion not found")
        }
        return ApiResponse.success(c, await ServicePromotionSerializer.single(promotion), "Service promotion retrieved successfully")
    }

    async store(c: Context) {
        const rawBody = await c.req.parseBody()
        const body = CreateServicePromotionValidator.parse(rawBody)

        const promotion = await this.service.create({
            serviceCode: body.serviceCode,
            title: body.title,
            description: body.description,
            url: body.url,
            startPeriod: body.startPeriod,
            endPeriod: body.endPeriod,
            isActive: body.isActive,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, await ServicePromotionSerializer.single(promotion), "Service promotion created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const rawBody = await c.req.parseBody()
        const body = UpdateServicePromotionValidator.parse(rawBody)

        const promotion = await this.service.update(id, {
            serviceCode: body.serviceCode,
            title: body.title,
            description: body.description,
            url: body.url,
            startPeriod: body.startPeriod,
            endPeriod: body.endPeriod,
            isActive: body.isActive,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, await ServicePromotionSerializer.single(promotion), "Service promotion updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Service promotion deleted successfully")
    }
}
