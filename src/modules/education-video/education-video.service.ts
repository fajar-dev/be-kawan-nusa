import { AppDataSource } from "../../config/database"
import { EducationVideo } from "./entities/education-video.entity"
import { Repository } from "typeorm"

export class EducationVideoService {
    private repository: Repository<EducationVideo>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationVideo)
    }

    async getAll(categoryId?: number, page: number = 1, limit: number = 10, q: string = "") {
        const query = this.repository.createQueryBuilder("video")
            .leftJoinAndSelect("video.category", "category")

        if (categoryId) {
            query.andWhere("video.categoryId = :categoryId", { categoryId })
        }

        if (q) {
            query.andWhere("video.title LIKE :q OR video.description LIKE :q", { q: `%${q}%` })
        }

        query.orderBy("video.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()
            
        return { data, total }
    }

    async getById(id: number) {
        return await this.repository.findOne({
            where: { id },
            relations: ["category"]
        })
    }
}
