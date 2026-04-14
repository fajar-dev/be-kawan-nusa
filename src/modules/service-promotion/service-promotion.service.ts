import { AppDataSource } from "../../config/database"
import { ServicePromotion } from "./entities/service-promotion.entity"
import { Repository } from "typeorm"

export class ServicePromotionService {
    private repository: Repository<ServicePromotion>

    constructor() {
        this.repository = AppDataSource.getRepository(ServicePromotion)
    }

    async getAll(page: number = 1, limit: number = 10, q: string = "") {
        const query = this.repository.createQueryBuilder("promotion")
            .leftJoinAndSelect("promotion.service", "service")
            .where("promotion.isActive = :isActive", { isActive: true })

        if (q) {
            query.andWhere("promotion.title LIKE :q OR promotion.description LIKE :q", { q: `%${q}%` })
        }

        query.orderBy("promotion.createdAt", "DESC")

        const [data, total] = await query
            .take(limit)
            .skip((page - 1) * limit)
            .getManyAndCount()
            
        return { data, total }
    }
}
