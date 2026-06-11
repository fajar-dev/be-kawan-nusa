import { Context } from "hono"
import { EducationArticleService } from "./education-article.service"
import { ApiResponse } from "../../core/helpers/response"
import { EducationArticleSerializer } from "./serializers/education-article.serialize"
import { BadRequestException } from "../../core/exceptions/base"
import { CreateEducationArticleValidator, UpdateEducationArticleValidator } from "./validators/education-article.validator"

export class EducationArticleController {
    constructor(private readonly service: EducationArticleService) {}

    async index(c: Context) {
        const user = c.get("user")
        const role = c.get("role")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const categoryId = c.req.query("categoryId") ? Number(c.req.query("categoryId")) : undefined
        const q = c.req.query("q") || ""
        const isViewParam = c.req.query("isView")
        const isView = isViewParam !== undefined ? isViewParam === "true" : undefined

        const { data, total } = await this.service.getAll(page, limit, {
            categoryId,
            q,
            currentUserId: role === "user" ? user?.id : undefined,
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
        const role = c.get("role")
        const id = Number(c.req.param("id"))
        const article = await this.service.getById(id, role === "user" ? user?.id : undefined)
        return ApiResponse.success(c, EducationArticleSerializer.single(article), "Education article details retrieved successfully")
    }

    async store(c: Context) {
        const rawBody = await c.req.parseBody()
        const body = CreateEducationArticleValidator.parse(rawBody)
        const { title, content, author, categoryId } = body

        const article = await this.service.create({
            categoryId,
            title,
            content,
            author,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, EducationArticleSerializer.single(article), "Education article created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const rawBody = await c.req.parseBody()
        const body = UpdateEducationArticleValidator.parse(rawBody)
        const { title, content, author, categoryId } = body

        const article = await this.service.update(id, {
            categoryId,
            title,
            content,
            author,
            imageFile: rawBody.image
        })

        return ApiResponse.success(c, EducationArticleSerializer.single(article), "Education article updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Education article deleted successfully")
    }

    async uploadImage(c: Context) {
        const body = await c.req.parseBody()
        const file = body.file
        if (!file || !(file instanceof File)) {
            throw new BadRequestException("File is required")
        }

        const url = await this.service.uploadEditorImage(file)
        return ApiResponse.success(c, { url }, "Image uploaded successfully")
    }
}
