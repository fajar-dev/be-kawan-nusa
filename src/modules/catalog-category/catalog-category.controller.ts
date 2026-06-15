import { Context } from "hono"
import { CatalogCategoryService } from "./catalog-category.service"
import { ApiResponse } from "../../core/helpers/response"
import { CatalogCategorySerializer } from "./serializers/catalog-category.serialize"
import { CreateCatalogCategoryValidator, UpdateCatalogCategoryValidator } from "./validators/catalog-category.validator"

export class CatalogCategoryController {
    constructor(private readonly service: CatalogCategoryService) {}

    async index(c: Context) {
        const categories = await this.service.getAll()
        return ApiResponse.success(c, CatalogCategorySerializer.collection(categories), "Catalog categories retrieved successfully")
    }

    async store(c: Context) {
        const body = await c.req.json() as CreateCatalogCategoryValidator
        const category = await this.service.create(body.name)
        return ApiResponse.success(c, CatalogCategorySerializer.single(category), "Catalog category created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const body = await c.req.json() as UpdateCatalogCategoryValidator
        const category = await this.service.update(id, body.name)
        return ApiResponse.success(c, CatalogCategorySerializer.single(category), "Catalog category updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Catalog category deleted successfully")
    }
}
