import { EntityManager } from "typeorm"
import { Point } from "./entities/point.entity"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { PointCalculator } from "../../core/helpers/point"
import { IPointRepository, PointListFilters } from "./interfaces/point.repository.interface"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

export class PointService {
    constructor(
        private readonly repository: IPointRepository,
        private readonly unitOfWork: IUnitOfWork,
        private readonly pointCalculator: PointCalculator,
    ) {}

    async getByUserId(userId: number): Promise<{ value: number }> {
        const value = await this.repository.getTotalAvailablePoints(userId)
        return { value }
    }

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: PointListFilters = {}): Promise<{ data: Point[]; total: number }> {
        return await this.repository.findAllByUserId(userId, page, limit, q, sort, order, filters)
    }

    async getByCustomerId(customerId: string, userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: PointListFilters = {}): Promise<{ data: Point[]; total: number }> {
        return await this.repository.findAllByCustomerId(customerId, userId, page, limit, q, sort, order, filters)
    }

    async create(data: Partial<Point>): Promise<Point> {
        return await this.unitOfWork.runInTransaction(async (manager) => {
            const cs = await manager.createQueryBuilder(CustomerService, "cs")
                .innerJoinAndSelect("cs.customer", "customer")
                .where("cs.id = :id", { id: data.customerServiceId })
                .getOne()

            if (!cs) {
                throw new NotFoundException("Customer service not found")
            }

            return await this.pointCalculator.addPointsReward(manager, data)
        })
    }

    async subtractPoints(userId: number, points: number, manager: EntityManager): Promise<void> {
        await this.pointCalculator.subtractPointsFIFO(manager, userId, points)
    }
}
