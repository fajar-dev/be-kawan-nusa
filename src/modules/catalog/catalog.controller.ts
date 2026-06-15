import { Context } from "hono"
import { CatalogService } from "./catalog.service"
import { ApiResponse } from "../../core/helpers/response"
import { CatalogSerializer } from "./serializers/catalog.serialize"
import { BadRequestException } from "../../core/exceptions/base"
import { CreateCatalogValidator, UpdateCatalogValidator } from "./validators/catalog.validator"

export class CatalogController {
    constructor(private readonly service: CatalogService) {}

    async index(c: Context) {
        const categoryId = Number(c.req.query("categoryId")) || undefined
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""

        const { data, total } = await this.service.getAll(page, limit, q, categoryId)

        return ApiResponse.paginate(
            c,
            CatalogSerializer.collection(data),
            total,
            page,
            limit,
            "Catalog retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const catalog = await this.service.getById(id)
        if (!catalog) {
            return ApiResponse.error(c, "Catalog item not found", 404)
        }
        return ApiResponse.success(c, CatalogSerializer.single(catalog), "Catalog item retrieved successfully")
    }

    async store(c: Context) {
        const rawBody = await c.req.parseBody()
        const body = CreateCatalogValidator.parse(rawBody)

        const catalog = await this.service.create({
            categoryId: body.categoryId,
            name: body.name,
            type: body.type,
            description: body.description,
            point: body.point,
            expiredDate: body.expiredDate,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, CatalogSerializer.single(catalog), "Catalog item created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const rawBody = await c.req.parseBody()
        const body = UpdateCatalogValidator.parse(rawBody)

        const catalog = await this.service.update(id, {
            categoryId: body.categoryId,
            name: body.name,
            type: body.type,
            description: body.description,
            point: body.point,
            expiredDate: body.expiredDate,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, CatalogSerializer.single(catalog), "Catalog item updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Catalog item deleted successfully")
    }

    async uploadImage(c: Context) {
        const body = await c.req.parseBody()
        const file = body.file
        if (!file || !(file instanceof File)) {
            throw new BadRequestException("File is required")
        }

        const url = await this.service.uploadImage(file)
        return ApiResponse.success(c, { url }, "Image uploaded successfully")
    }
}
