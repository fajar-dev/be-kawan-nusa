import { Context } from "hono"
import { EducationCategoryService } from "./education-category.service"
import { ApiResponse } from "../../core/helpers/response"
import { EducationCategorySerializer } from "./serializers/education-category.serialize"

export class EducationCategoryController {
    constructor(private readonly service: EducationCategoryService) {}

    async index(c: Context) {
        const categories = await this.service.getAll()
        return ApiResponse.success(c, EducationCategorySerializer.collection(categories), "Education categories retrieved successfully")
    }
}
