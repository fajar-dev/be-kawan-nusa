import { AppDataSource } from "../../config/database"
import { Reward } from "./entities/reward.entity"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { PointHelper } from "../../core/helpers/point"
import { IRewardRepository, RewardListFilters } from "./interfaces/reward.repository.interface"

export class RewardService {
    constructor(private readonly repository: IRewardRepository) {}

    async getAll(
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: RewardListFilters = {}
    ): Promise<{ data: Reward[]; total: number }> {
        return await this.repository.findAllByUserId(userId, page, limit, q, sort, order, filters)
    }

    async getByCustomerId(
        customerId: string,
        userId: number,
        page: number,
        limit: number,
        q: string,
        sort: string,
        order: string,
        filters: RewardListFilters = {}
    ): Promise<{ data: Reward[]; total: number }> {
        return await this.repository.findAllByCustomerId(customerId, userId, page, limit, q, sort, order, filters)
    }

    async create(data: Partial<Reward>): Promise<Reward> {
        return await AppDataSource.transaction(async (manager) => {
            const cs = await manager.createQueryBuilder(CustomerService, "cs")
                .innerJoinAndSelect("cs.customer", "customer")
                .where("cs.id = :id", { id: data.customerServiceId })
                .getOne()

            if (!cs) {
                throw new NotFoundException("Customer service not found")
            }

            return await PointHelper.addPointsReward(manager, data)
        })
    }
}
