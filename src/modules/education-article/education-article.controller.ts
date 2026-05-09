import { Context } from "hono"
import { EducationArticleService } from "./education-article.service"
import { ApiResponse } from "../../core/helpers/response"
import { EducationArticleSerializer } from "./serializers/education-article.serialize"

export class EducationArticleController {
    constructor(private readonly service: EducationArticleService) {}

    async index(c: Context) {
        const user = c.get("user")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const categoryId = c.req.query("categoryId") ? Number(c.req.query("categoryId")) : undefined
        const q = c.req.query("q") || ""
        const isViewParam = c.req.query("isView")
        const isView = isViewParam !== undefined ? isViewParam === "true" : undefined

        const { data, total } = await this.service.getAll(page, limit, {
            categoryId,
            q,
            currentUserId: user?.id,
            isView,
        })

        return ApiResponse.paginate(
            c,
            EducationArticleSerializer.collection(data),
            total,
            page,
            limit,
            "Education articles retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get("user")
        const id = Number(c.req.param("id"))
        const article = await this.service.getById(id, user?.id)
        return ApiResponse.success(c, EducationArticleSerializer.single(article), "Education article details retrieved successfully")
    }
}
