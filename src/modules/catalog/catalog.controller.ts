import { Context } from "hono"
import { CatalogService } from "./catalog.service"
import { ApiResponse } from "../../core/helpers/response"
import { CatalogSerializer } from "./serializers/catalog.serialize"
import { BadRequestException } from "../../core/exceptions/base"
import { CreateCatalogValidator, UpdateCatalogValidator } from "./validators/catalog.validator"

export class CatalogController {
    constructor(private readonly service: CatalogService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""
        const sort = c.req.query("sort") || "createdAt"
        const order = c.req.query("order") || "DESC"

        // Parse categoryIds (supporting categoryId, categoryId[], categoryIds, categoryIds[])
        let categoryIds: number[] | undefined = undefined
        const categoryArrayQueries = c.req.queries("categoryId[]") || c.req.queries("categoryIds[]")
        if (categoryArrayQueries && categoryArrayQueries.length > 0) {
            categoryIds = categoryArrayQueries.map(id => Number(id)).filter(id => !isNaN(id))
        } else {
            const categorySingleQuery = c.req.query("categoryId") || c.req.query("categoryIds")
            if (categorySingleQuery) {
                categoryIds = categorySingleQuery.split(",")
                    .map(id => Number(id.trim()))
                    .filter(id => !isNaN(id))
            }
        }

        // Parse types (supporting type, type[], types, types[])
        let types: string[] | undefined = undefined
        const typeArrayQueries = c.req.queries("type[]") || c.req.queries("types[]")
        if (typeArrayQueries && typeArrayQueries.length > 0) {
            types = typeArrayQueries
        } else {
            const typeSingleQuery = c.req.query("type") || c.req.query("types")
            if (typeSingleQuery) {
                types = typeSingleQuery.split(",").map(t => t.trim())
            }
        }

        const { data, total } = await this.service.getAll(page, limit, q, categoryIds, types, sort, order)

        return ApiResponse.paginate(
            c,
            await CatalogSerializer.collection(data),
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
        return ApiResponse.success(c, await CatalogSerializer.single(catalog), "Catalog item retrieved successfully")
    }

    async store(c: Context) {
        const user = c.get("user")
        const rawBody = await c.req.parseBody()
        const body = CreateCatalogValidator.parse(rawBody)

        const catalog = await this.service.create({
            categoryId: body.categoryId,
            name: body.name,
            type: body.type,
            description: body.description,
            point: body.point,
            stock: body.stock,
            expiredDate: body.expiredDate,
            createdById: user?.id,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, await CatalogSerializer.single(catalog), "Catalog item created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const user = c.get("user")
        const rawBody = await c.req.parseBody()
        const body = UpdateCatalogValidator.parse(rawBody)

        const catalog = await this.service.update(id, {
            categoryId: body.categoryId,
            name: body.name,
            type: body.type,
            description: body.description,
            point: body.point,
            stock: body.stock,
            expiredDate: body.expiredDate,
            createdById: user?.id,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, await CatalogSerializer.single(catalog), "Catalog item updated successfully")
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

    async stockHistory(c: Context) {
        const catalogId = Number(c.req.param("id"))
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10

        const catalog = await this.service.getById(catalogId)
        if (!catalog) {
            return ApiResponse.error(c, "Catalog item not found", 404)
        }

        const { data, total } = await this.service.getStockHistory(catalogId, page, limit)

        const serialized = data.map(item => ({
            id: item.id,
            catalogId: item.catalogId,
            type: item.type,
            quantity: item.quantity,
            stockBefore: item.stockBefore,
            stockAfter: item.stockAfter,
            notes: item.notes,
            createdBy: item.createdBy ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
            } : null,
            user: item.user ? {
                id: item.user.id,
                name: [item.user.firstName, item.user.lastName].filter(Boolean).join(' '),
            } : null,
            createdAt: item.createdAt,
        }))

        return ApiResponse.paginate(c, serialized, total, page, limit, "Stock history retrieved successfully")
    }
}
