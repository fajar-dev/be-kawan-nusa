import { Context } from "hono"
import { TemplateService } from "./template.service"
import { ApiResponse } from "../../core/helpers/response"
import { TemplateSerializer } from "./serializers/template.serialize"
import { NotFoundException } from "../../core/exceptions/base"
import { CreateTemplateValidator, UpdateTemplateValidator } from "./validators/template.validator"

export class TemplateController {
    constructor(private readonly service: TemplateService) {}

    async index(c: Context) {
        const role = c.get("role")
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""

        const { data, total } = await this.service.getAll(page, limit, q, role === "admin")

        return ApiResponse.paginate(
            c,
            await TemplateSerializer.collection(data),
            total,
            page,
            limit,
            "Templates retrieved successfully"
        )
    }

    async show(c: Context) {
        const role = c.get("role")
        const id = Number(c.req.param("id"))
        const item = await this.service.getById(id, role === "admin")
        if (!item) throw new NotFoundException("Template not found")
        return ApiResponse.success(c, await TemplateSerializer.single(item), "Template details retrieved successfully")
    }

    async store(c: Context) {
        const rawBody = await c.req.parseBody()
        const body = CreateTemplateValidator.parse(rawBody)

        const template = await this.service.create({
            name: body.name,
            description: body.description,
            isActive: body.isActive,
            thumbnailFile: rawBody.thumbnail,
            pngFile: rawBody.png,
            jpgFile: rawBody.jpg,
            mp4File: rawBody.mp4,
            psdFile: rawBody.psd
        })

        return ApiResponse.success(c, await TemplateSerializer.single(template), "Template created successfully")
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const rawBody = await c.req.parseBody()
        const body = UpdateTemplateValidator.parse(rawBody)

        const template = await this.service.update(id, {
            name: body.name,
            description: body.description,
            isActive: body.isActive,
            thumbnailFile: rawBody.thumbnail,
            pngFile: rawBody.png,
            jpgFile: rawBody.jpg,
            mp4File: rawBody.mp4,
            psdFile: rawBody.psd
        })

        return ApiResponse.success(c, await TemplateSerializer.single(template), "Template updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Template deleted successfully")
    }

    async download(c: Context) {
        const id = Number(c.req.param("id"))
        const type = c.req.query("type") as "png" | "jpg" | "mp4" | "psd"
        const item = await this.service.getById(id, true)

        if (!item) throw new NotFoundException("Template not found")

        const filePath = item[type]
        if (!filePath) throw new NotFoundException(`File for type ${type} not found`)

        if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
            return c.redirect(filePath)
        }

        const { minio } = await import("../../core/helpers/minio")
        const presignedUrl = await minio.getPresignedUrl(filePath)
        return c.redirect(presignedUrl)
    }
}
