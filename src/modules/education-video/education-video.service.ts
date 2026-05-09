import { EducationVideo } from "./entities/education-video.entity"
import { NotFoundException } from "../../core/exceptions/base"
import {
    EducationVideoListFilters,
    IEducationVideoRepository,
} from "./interfaces/education-video.repository.interface"

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
}
