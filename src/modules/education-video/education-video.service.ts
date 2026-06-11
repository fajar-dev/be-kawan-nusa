import { EducationVideo } from "./entities/education-video.entity"
import { NotFoundException } from "../../core/exceptions/base"
import {
    EducationVideoListFilters,
    IEducationVideoRepository,
} from "./interfaces/education-video.repository.interface"
import { minio } from "../../core/helpers/minio"

export class EducationVideoService {
    constructor(private readonly repository: IEducationVideoRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        filters: EducationVideoListFilters = {}
    ): Promise<{ data: EducationVideo[]; total: number }> {
        const { data, total } = await this.repository.findAll(page, limit, filters)

        if (filters.currentUserId && data.length > 0) {
            const viewedIds = await this.repository.getViewedVideoIds(
                filters.currentUserId,
                data.map(v => v.id)
            )
            const viewedSet = new Set(viewedIds)
            data.forEach(v => { v.isViewed = viewedSet.has(v.id) })
        }

        return { data, total }
    }

    async getById(id: number, userId?: number): Promise<EducationVideo> {
        const video = await this.repository.findById(id)
        if (!video) {
            throw new NotFoundException("Education video not found")
        }

        if (userId) {
            const alreadyViewed = await this.repository.hasViewed(id, userId)
            if (!alreadyViewed) {
                await this.repository.recordView(id, userId)
            }
            video.isViewed = true
        }

        return video
    }

    async create(data: { categoryId: number; title: string; url: string; description?: string; authorId?: number; thumbnailFile?: any }): Promise<EducationVideo> {
        let thumbnail: string | undefined = undefined
        const file = data.thumbnailFile
        if (file && file instanceof File && file.size > 0) {
            const rawExt = file.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `education/videos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
            const buffer = Buffer.from(await file.arrayBuffer())
            await minio.upload(filename, buffer, file.type)
            thumbnail = filename
        } else if (typeof file === "string" && file.length > 0) {
            thumbnail = file
        }

        const video = new EducationVideo()
        video.categoryId = data.categoryId
        video.title = data.title
        video.url = data.url
        video.description = data.description
        video.authorId = data.authorId
        video.thumbnail = thumbnail
        return await this.repository.save(video)
    }

    async update(id: number, data: { categoryId?: number; title?: string; url?: string; description?: string; authorId?: number; thumbnailFile?: any }): Promise<EducationVideo> {
        const video = await this.repository.findById(id)
        if (!video) {
            throw new NotFoundException("Education video not found")
        }

        if (data.categoryId !== undefined) video.categoryId = data.categoryId
        if (data.title !== undefined) video.title = data.title
        if (data.url !== undefined) video.url = data.url
        if (data.description !== undefined) video.description = data.description
        if (data.authorId !== undefined) video.authorId = data.authorId

        if (data.thumbnailFile !== undefined) {
            let newThumbnail: string | undefined = undefined
            const file = data.thumbnailFile
            if (file && file instanceof File && file.size > 0) {
                const rawExt = file.type.split("/")[1]
                const ext = rawExt === "jpeg" ? "jpg" : rawExt
                const filename = `education/videos/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
                const buffer = Buffer.from(await file.arrayBuffer())
                await minio.upload(filename, buffer, file.type)
                newThumbnail = filename
            } else if (typeof file === "string") {
                newThumbnail = file
            }

            if (newThumbnail !== undefined) {
                if (video.thumbnail && !video.thumbnail.startsWith("http://") && !video.thumbnail.startsWith("https://") && video.thumbnail !== newThumbnail) {
                    try {
                        await minio.delete(video.thumbnail)
                    } catch (err) {
                        console.error("[Video] Failed to delete old thumbnail from MinIO:", err)
                    }
                }
                video.thumbnail = newThumbnail === "" ? undefined : newThumbnail
            }
        }

        return await this.repository.save(video)
    }

    async delete(id: number): Promise<void> {
        const video = await this.repository.findById(id)
        if (!video) {
            throw new NotFoundException("Education video not found")
        }

        if (video.thumbnail && !video.thumbnail.startsWith("http://") && !video.thumbnail.startsWith("https://")) {
            try {
                await minio.delete(video.thumbnail)
            } catch (err) {
                console.error("[Video] Failed to delete thumbnail from MinIO:", err)
            }
        }

        await this.repository.delete(id)
    }
}
