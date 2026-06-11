import { Context } from "hono"
import { EducationVideoService } from "./education-video.service"
import { ApiResponse } from "../../core/helpers/response"
import { EducationVideoSerializer } from "./serializers/education-video.serialize"
import { CreateEducationVideoValidator, UpdateEducationVideoValidator } from "./validators/education-video.validator"

export class EducationVideoController {
    constructor(private readonly service: EducationVideoService) {}

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
            await EducationVideoSerializer.collection(data),
            total,
            page,
            limit,
            "Education videos retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get("user")
        const role = c.get("role")
        const id = Number(c.req.param("id"))
        const video = await this.service.getById(id, role === "user" ? user?.id : undefined)
        return ApiResponse.success(c, await EducationVideoSerializer.single(video), "Education video details retrieved successfully")
    }

    async store(c: Context) {
        const rawBody = await c.req.parseBody()
        const body = CreateEducationVideoValidator.parse(rawBody)
        const { title, url, description, author, categoryId } = body

        const video = await this.service.create({
            categoryId,
            title,
            url,
            description,
            author,
            thumbnailFile: rawBody.thumbnail
        })

        return ApiResponse.success(c, await EducationVideoSerializer.single(video), "Education video created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const rawBody = await c.req.parseBody()
        const body = UpdateEducationVideoValidator.parse(rawBody)
        const { title, url, description, author, categoryId } = body

        const video = await this.service.update(id, {
            categoryId,
            title,
            url,
            description,
            author,
            thumbnailFile: rawBody.thumbnail
        })

        return ApiResponse.success(c, await EducationVideoSerializer.single(video), "Education video updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Education video deleted successfully")
    }
}
