import { ServicePromotion } from "../entities/service-promotion.entity"

export interface IServicePromotionRepository {
    findAll(page: number, limit: number, q: string): Promise<{ data: ServicePromotion[]; total: number }>
}
