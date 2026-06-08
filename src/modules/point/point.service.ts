import { EntityManager } from "typeorm"
import { PointHelper } from "../../core/helpers/point"
import { IPointRepository } from "./interfaces/point.repository.interface"

export class PointService {
    constructor(private readonly repository: IPointRepository) {}

    async getByUserId(userId: number): Promise<{ value: number }> {
        const value = await this.repository.getTotalAvailablePoints(userId)
        return { value }
    }

    async subtractPoints(userId: number, points: number, manager: EntityManager): Promise<void> {
        await PointHelper.subtractPointsFIFO(manager, userId, points)
    }
}
