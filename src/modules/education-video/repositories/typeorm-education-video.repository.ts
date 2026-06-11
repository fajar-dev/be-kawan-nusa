import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { EducationVideo } from "../entities/education-video.entity"
import { EducationVideoView } from "../entities/education-video-view.entity"
import {
    EducationVideoListFilters,
    IEducationVideoRepository,
} from "../interfaces/education-video.repository.interface"

export class TypeOrmEducationVideoRepository implements IEducationVideoRepository {
    private readonly repository: Repository<EducationVideo>
    private readonly viewRepository: Repository<EducationVideoView>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationVideo)
        this.viewRepository = AppDataSource.getRepository(EducationVideoView)
    }

    async findAll(
        page: number,
        limit: number,
        filters: EducationVideoListFilters = {}
    ): Promise<{ data: EducationVideo[]; total: number }> {
        const query = this.repository.createQueryBuilder("video")
            .leftJoinAndSelect("video.category", "category")

        if (filters.categoryId) query.andWhere("video.categoryId = :categoryId", { categoryId: filters.categoryId })
        if (filters.q) query.andWhere("video.title LIKE :q OR video.description LIKE :q", { q: `%${filters.q}%` })

        if (filters.currentUserId !== undefined && filters.isView !== undefined) {
            const condition = filters.isView ? "video.id IN" : "video.id NOT IN"
            query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("view.educationVideoId")
                    .from(EducationVideoView, "view")
                    .where("view.userId = :currentUserId", { currentUserId: filters.currentUserId })
                    .getQuery()
                return `${condition} ${subQuery}`
            })
        }

        query.orderBy("video.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<EducationVideo | null> {
        return await this.repository.findOne({ where: { id }, relations: ["category"] })
    }

    async getViewedVideoIds(userId: number, videoIds: number[]): Promise<number[]> {
        const views = await this.viewRepository.createQueryBuilder("view")
            .select("view.educationVideoId")
            .where("view.userId = :userId", { userId })
            .andWhere("view.educationVideoId IN (:...videoIds)", { videoIds })
            .getRawMany()
        return views.map(v => v.view_education_video_id)
    }

    async recordView(videoId: number, userId: number): Promise<void> {
        await this.viewRepository.save({ educationVideoId: videoId, userId })
    }

    async hasViewed(videoId: number, userId: number): Promise<boolean> {
        const view = await this.viewRepository.findOne({ where: { educationVideoId: videoId, userId } })
        return !!view
    }

    async save(video: EducationVideo): Promise<EducationVideo> {
        const saved = await this.repository.save(video)
        // Reload relations so category details are available
        const reloaded = await this.findById(saved.id)
        if (!reloaded) return saved
        return reloaded
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
