import { EducationArticle } from "./entities/education-article.entity"
import { NotFoundException } from "../../core/exceptions/base"
import {
    EducationArticleListFilters,
    IEducationArticleRepository,
} from "./interfaces/education-article.repository.interface"
import { minio } from "../../core/helpers/minio"

export class EducationArticleService {
    constructor(private readonly repository: IEducationArticleRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        filters: EducationArticleListFilters = {}
    ): Promise<{ data: EducationArticle[]; total: number }> {
        const { data, total } = await this.repository.findAll(page, limit, filters)

        if (filters.currentUserId && data.length > 0) {
            const viewedIds = await this.repository.getViewedArticleIds(
                filters.currentUserId,
                data.map(a => a.id)
            )
            const viewedSet = new Set(viewedIds)
            data.forEach(a => { a.isViewed = viewedSet.has(a.id) })
        }

        return { data, total }
    }

    async getById(id: number, userId?: number): Promise<EducationArticle> {
        const article = await this.repository.findById(id)
        if (!article) {
            throw new NotFoundException("Education article not found")
        }

        if (userId) {
            const alreadyViewed = await this.repository.hasViewed(id, userId)
            if (!alreadyViewed) {
                await this.repository.recordView(id, userId)
            }
            article.isViewed = true
        }

        return article
    }

    async create(data: { categoryId: number; title: string; content: string; author?: string; imageFile?: any }): Promise<EducationArticle> {
        let image: string | undefined = undefined
        const file = data.imageFile
        if (file && file instanceof File && file.size > 0) {
            const rawExt = file.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `education/articles/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
            const buffer = Buffer.from(await file.arrayBuffer())
            await minio.upload(filename, buffer, file.type)
            image = filename
        }

        const article = new EducationArticle()
        article.categoryId = data.categoryId
        article.title = data.title
        article.content = data.content
        article.author = data.author
        article.image = image
        return await this.repository.save(article)
    }

    async update(id: number, data: { categoryId?: number; title?: string; content?: string; author?: string; imageFile?: any }): Promise<EducationArticle> {
        const article = await this.repository.findById(id)
        if (!article) {
            throw new NotFoundException("Education article not found")
        }

        if (data.categoryId !== undefined) article.categoryId = data.categoryId
        if (data.title !== undefined) article.title = data.title
        if (data.content !== undefined) article.content = data.content
        if (data.author !== undefined) article.author = data.author
        
        if (data.imageFile !== undefined) {
            let newImage: string | undefined = undefined
            const file = data.imageFile
            if (file && file instanceof File && file.size > 0) {
                const rawExt = file.type.split("/")[1]
                const ext = rawExt === "jpeg" ? "jpg" : rawExt
                const filename = `education/articles/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
                const buffer = Buffer.from(await file.arrayBuffer())
                await minio.upload(filename, buffer, file.type)
                newImage = filename
            } else if (typeof file === "string" && file === "") {
                newImage = ""
            }

            if (newImage !== undefined) {
                if (article.image && article.image !== newImage) {
                    try {
                        await minio.delete(article.image)
                    } catch (err) {
                        console.error("[Article] Failed to delete old image from MinIO:", err)
                    }
                }
                article.image = newImage === "" ? undefined : newImage
            }
        }

        return await this.repository.save(article)
    }

    async delete(id: number): Promise<void> {
        const article = await this.repository.findById(id)
        if (!article) {
            throw new NotFoundException("Education article not found")
        }

        if (article.image) {
            try {
                await minio.delete(article.image)
            } catch (err) {
                console.error("[Article] Failed to delete image from MinIO:", err)
            }
        }

        await this.repository.delete(id)
    }

    async uploadEditorImage(file: File): Promise<string> {
        const rawExt = file.type.split("/")[1]
        const ext = rawExt === "jpeg" ? "jpg" : rawExt
        const filename = `education/articles/editor/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        await minio.upload(filename, buffer, file.type)
        return minio.getProxyUrl(filename)
    }
}
