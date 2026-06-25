import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { ServicePromotion } from "../entities/service-promotion.entity"
import { IServicePromotionRepository } from "../interfaces/service-promotion.repository.interface"

export class ServicePromotionRepository implements IServicePromotionRepository {
    private readonly repository: Repository<ServicePromotion>

    constructor() {
        this.repository = AppDataSource.getRepository(ServicePromotion)
    }

    async findAll(page: number, limit: number, q: string, showAll?: boolean): Promise<{ data: ServicePromotion[]; total: number }> {
        const query = this.repository.createQueryBuilder("promotion")
            .leftJoinAndSelect("promotion.service", "service")

        if (!showAll) {
            query.where("promotion.isActive = :isActive", { isActive: true })
        }

        if (q) {
            if (!showAll) {
                query.andWhere("(promotion.title LIKE :q OR promotion.description LIKE :q)", { q: `%${q}%` })
            } else {
                query.where("promotion.title LIKE :q OR promotion.description LIKE :q", { q: `%${q}%` })
            }
        }

        query.orderBy("promotion.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<ServicePromotion | null> {
        return await this.repository.createQueryBuilder("promotion")
            .leftJoinAndSelect("promotion.service", "service")
            .where("promotion.id = :id", { id })
            .getOne()
    }

    async save(promotion: ServicePromotion): Promise<ServicePromotion> {
        return await this.repository.save(promotion)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
