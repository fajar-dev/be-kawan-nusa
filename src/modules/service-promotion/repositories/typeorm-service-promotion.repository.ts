import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { ServicePromotion } from "../entities/service-promotion.entity"
import { IServicePromotionRepository } from "../interfaces/service-promotion.repository.interface"

export class TypeOrmServicePromotionRepository implements IServicePromotionRepository {
    private readonly repository: Repository<ServicePromotion>

    constructor() {
        this.repository = AppDataSource.getRepository(ServicePromotion)
    }

    async findAll(page: number, limit: number, q: string): Promise<{ data: ServicePromotion[]; total: number }> {
        const query = this.repository.createQueryBuilder("promotion")
            .leftJoinAndSelect("promotion.service", "service")
            .where("promotion.isActive = :isActive", { isActive: true })

        if (q) query.andWhere("promotion.title LIKE :q OR promotion.description LIKE :q", { q: `%${q}%` })

        query.orderBy("promotion.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }
}
