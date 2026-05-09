import { ServicePromotion } from "./entities/service-promotion.entity"
import { IServicePromotionRepository } from "./interfaces/service-promotion.repository.interface"

export class ServicePromotionService {
    constructor(private readonly repository: IServicePromotionRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = ""
    ): Promise<{ data: ServicePromotion[]; total: number }> {
        return await this.repository.findAll(page, limit, q)
    }
}
