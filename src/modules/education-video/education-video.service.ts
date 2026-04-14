import { AppDataSource } from "../../config/database"
import { EducationVideo } from "./entities/education-video.entity"
import { EducationVideoView } from "./entities/education-video-view.entity"
import { Repository } from "typeorm"
import { NotFoundException } from "../../core/exceptions/base"

export class EducationVideoService {
    private repository: Repository<EducationVideo>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationVideo)
    }

    async getAll(categoryId?: number, page: number = 1, limit: number = 10, q: string = "", currentUserId?: number, isView?: boolean) {
        const query = this.repository.createQueryBuilder("video")
            .leftJoinAndSelect("video.category", "category")

        if (categoryId) {
            query.andWhere("video.categoryId = :categoryId", { categoryId })
        }

        if (q) {
            query.andWhere("video.title LIKE :q OR video.description LIKE :q", { q: `%${q}%` })
        }

        if (currentUserId && isView !== undefined) {
            if (isView) {
                query.andWhere(qb => {
                    const subQuery = qb.subQuery()
                        .select("view.educationVideoId")
                        .from(EducationVideoView, "view")
                        .where("view.userId = :currentUserId", { currentUserId })
                        .getQuery()
                    return "video.id IN " + subQuery
                })
            } else {
                query.andWhere(qb => {
                    const subQuery = qb.subQuery()
                        .select("view.educationVideoId")
                        .from(EducationVideoView, "view")
                        .where("view.userId = :currentUserId", { currentUserId })
                        .getQuery()
                    return "video.id NOT IN " + subQuery
                })
            }
        }

        query.orderBy("video.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()

        if (currentUserId && data.length > 0) {
            const viewedVideoIds = await AppDataSource.getRepository(EducationVideoView)
                .createQueryBuilder("view")
                .select("view.educationVideoId")
                .where("view.userId = :currentUserId", { currentUserId })
                .andWhere("view.educationVideoId IN (:...videoIds)", { videoIds: data.map(v => v.id) })
                .getRawMany()
            
            const viewedSet = new Set(viewedVideoIds.map(v => v.view_education_video_id))
            data.forEach(v => {
                v.isViewed = viewedSet.has(v.id)
            })
        }
            
        return { data, total }
    }

    async getById(id: number, userId?: number) {
        const video = await this.repository.findOne({
            where: { id },
            relations: ["category"]
        })

        if (!video) {
            throw new NotFoundException("Education video not found")
        }

        if (userId) {
            const existingView = await AppDataSource.getRepository(EducationVideoView).findOne({
                where: { educationVideoId: id, userId }
            })

            if (!existingView) {
                await AppDataSource.getRepository(EducationVideoView).save({
                    educationVideoId: id,
                    userId: userId
                })
            }
            
            video.isViewed = true
        }

        return video
    }
}
