import { ServicePromotion } from "../entities/service-promotion.entity"

export interface IServicePromotionRepository {
    findAll(page: number, limit: number, q: string, showAll?: boolean): Promise<{ data: ServicePromotion[]; total: number }>
    findById(id: number): Promise<ServicePromotion | null>
    save(promotion: ServicePromotion): Promise<ServicePromotion>
    delete(id: number): Promise<void>
}
