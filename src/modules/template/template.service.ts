import { Template } from "./entities/template.entity"
import { ITemplateRepository } from "./interfaces/template.repository.interface"
import { minio } from "../../core/helpers/minio"
import { NotFoundException } from "../../core/exceptions/base"

export class TemplateService {
    constructor(private readonly repository: ITemplateRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = "",
        showAll?: boolean
    ): Promise<{ data: Template[]; total: number }> {
        return await this.repository.findAll(page, limit, q, showAll)
    }

    async getById(id: number, showAll?: boolean): Promise<Template | null> {
        return await this.repository.findById(id, showAll)
    }

    private async uploadFile(file: any, folder: string): Promise<string | undefined> {
        if (file && file instanceof File && file.size > 0) {
            const rawExt = file.type.split("/")[1] || "bin"
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const originalName = file.name || ""
            const nameExt = originalName.split(".").pop()?.toLowerCase()
            const finalExt = nameExt || ext
            
            const filename = `templates/${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${finalExt}`
            const buffer = Buffer.from(await file.arrayBuffer())
            await minio.upload(filename, buffer, file.type || "application/octet-stream")
            return filename
        }
        return undefined
    }

    async create(data: {
        name: string
        description?: string
        isActive?: boolean
        thumbnailFile?: any
        pngFile?: any
        jpgFile?: any
        mp4File?: any
        psdFile?: any
    }): Promise<Template> {
        const template = new Template()
        template.name = data.name
        template.description = data.description
        template.isActive = data.isActive ?? true

        if (data.thumbnailFile) {
            template.thumbnail = await this.uploadFile(data.thumbnailFile, "thumbnails")
        }
        if (data.pngFile) {
            template.png = await this.uploadFile(data.pngFile, "assets")
        }
        if (data.jpgFile) {
            template.jpg = await this.uploadFile(data.jpgFile, "assets")
        }
        if (data.mp4File) {
            template.mp4 = await this.uploadFile(data.mp4File, "assets")
        }
        if (data.psdFile) {
            template.psd = await this.uploadFile(data.psdFile, "assets")
        }

        return await this.repository.save(template)
    }

    async update(id: number, data: {
        name?: string
        description?: string
        isActive?: boolean
        thumbnailFile?: any
        pngFile?: any
        jpgFile?: any
        mp4File?: any
        psdFile?: any
    }): Promise<Template> {
        const template = await this.repository.findById(id, true)
        if (!template) {
            throw new NotFoundException("Template not found")
        }

        if (data.name !== undefined) template.name = data.name
        if (data.description !== undefined) template.description = data.description
        if (data.isActive !== undefined) template.isActive = data.isActive

        const fileFields = ["thumbnail", "png", "jpg", "mp4", "psd"] as const
        for (const field of fileFields) {
            const fileKey = `${field}File` as const
            const fileVal = (data as any)[fileKey]
            
            if (fileVal !== undefined) {
                let newPath: string | undefined = undefined
                if (fileVal && fileVal instanceof File && fileVal.size > 0) {
                    newPath = await this.uploadFile(fileVal, field === "thumbnail" ? "thumbnails" : "assets")
                } else if (typeof fileVal === "string" && fileVal === "") {
                    newPath = ""
                }

                if (newPath !== undefined) {
                    const oldPath = (template as any)[field]
                    if (oldPath && oldPath !== newPath) {
                        try {
                            await minio.delete(oldPath)
                        } catch (err) {
                            console.error(`[Template] Failed to delete old ${field} from MinIO:`, err)
                        }
                    }
                    (template as any)[field] = newPath === "" ? undefined : newPath
                }
            }
        }

        return await this.repository.save(template)
    }

    async delete(id: number): Promise<void> {
        const template = await this.repository.findById(id, true)
        if (!template) {
            throw new NotFoundException("Template not found")
        }

        const fileFields = ["thumbnail", "png", "jpg", "mp4", "psd"] as const
        for (const field of fileFields) {
            const path = (template as any)[field]
            if (path) {
                try {
                    await minio.delete(path)
                } catch (err) {
                    console.error(`[Template] Failed to delete ${field} from MinIO during template deletion:`, err)
                }
            }
        }

        await this.repository.delete(id)
    }
}
