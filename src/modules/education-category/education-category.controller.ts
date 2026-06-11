import { Context } from "hono"
import { EducationCategoryService } from "./education-category.service"
import { ApiResponse } from "../../core/helpers/response"
import { EducationCategorySerializer } from "./serializers/education-category.serialize"
import { CreateEducationCategoryValidator, UpdateEducationCategoryValidator } from "./validators/education-category.validator"

export class EducationCategoryController {
    constructor(private readonly service: EducationCategoryService) {}

    async index(c: Context) {
        const categories = await this.service.getAll()
        return ApiResponse.success(c, EducationCategorySerializer.collection(categories), "Education categories retrieved successfully")
    }

    async store(c: Context) {
        const body = await c.req.json() as CreateEducationCategoryValidator
        const category = await this.service.create(body.name)
        return ApiResponse.success(c, EducationCategorySerializer.single(category), "Education category created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const body = await c.req.json() as UpdateEducationCategoryValidator
        const category = await this.service.update(id, body.name)
        return ApiResponse.success(c, EducationCategorySerializer.single(category), "Education category updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Education category deleted successfully")
    }
}
