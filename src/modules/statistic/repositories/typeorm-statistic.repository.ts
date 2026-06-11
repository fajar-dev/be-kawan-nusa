import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Customer } from "../../customer/entities/customer.entity"
import { CustomerService } from "../../customer-service/entities/customer-service.entity"
import { Reward } from "../../reward/entities/reward.entity"
import { Redemption } from "../../redemption/entities/redemption.entity"
import { User } from "../../user/entities/user.entity"
import { IStatisticRepository, MonthlyCount } from "../interfaces/statistic.repository.interface"

export class TypeOrmStatisticRepository implements IStatisticRepository {
    private readonly customerRepository: Repository<Customer>
    private readonly customerServiceRepository: Repository<CustomerService>
    private readonly rewardRepository: Repository<Reward>
    private readonly redemptionRepository: Repository<Redemption>
    private readonly userRepository: Repository<User>

    constructor() {
        this.customerRepository = AppDataSource.getRepository(Customer)
        this.customerServiceRepository = AppDataSource.getRepository(CustomerService)
        this.rewardRepository = AppDataSource.getRepository(Reward)
        this.redemptionRepository = AppDataSource.getRepository(Redemption)
        this.userRepository = AppDataSource.getRepository(User)
    }

    async getCustomerTotal(userId: number): Promise<number> {
        const result = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .where("cs.userId = :userId", { userId })
            .select("COUNT(DISTINCT customer.id)", "total")
            .getRawOne()
        return Number(result?.total || 0)
    }

    async getCustomerCountByMonth(userId: number, month: number, year: number): Promise<number> {
        const result = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(customer.createdAt) = :month", { month })
            .andWhere("YEAR(customer.createdAt) = :year", { year })
            .select("COUNT(DISTINCT customer.id)", "total")
            .getRawOne()
        return Number(result?.total || 0)
    }

    async getCustomerServiceTotal(userId: number): Promise<number> {
        return await this.customerServiceRepository.count({ where: { userId } })
    }

    async getCustomerServiceCountByMonth(userId: number, month: number, year: number): Promise<number> {
        return await this.customerServiceRepository.createQueryBuilder("cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(cs.referenceDate) = :month", { month })
            .andWhere("YEAR(cs.referenceDate) = :year", { year })
            .getCount()
    }

    async getPointsByMonth(userId: number, month: number, year: number): Promise<number> {
        const result = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("SUM(reward.point)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(reward.createdAt) = :month", { month })
            .andWhere("YEAR(reward.createdAt) = :year", { year })
            .getRawOne()
        return Number(result?.total || 0)
    }

    async getMonthlyPointSums(userId: number, year: number): Promise<MonthlyCount[]> {
        const rawData = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("MONTH(reward.createdAt)", "month")
            .addSelect("SUM(reward.point)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("YEAR(reward.createdAt) = :year", { year })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany()
        return rawData.map(r => ({ month: parseInt(r.month), total: Number(r.total) }))
    }

    async getCustomerCountByDayInMonth(
        userId: number,
        year: number,
        month: number
    ): Promise<{ day: number; count: number }[]> {
        const rawData = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .select("DAY(customer.createdAt)", "day")
            .addSelect("COUNT(DISTINCT customer.id)", "count")
            .where("cs.userId = :userId", { userId })
            .andWhere("YEAR(customer.createdAt) = :year", { year })
            .andWhere("MONTH(customer.createdAt) = :month", { month })
            .groupBy("day")
            .orderBy("day", "ASC")
            .getRawMany()
        return rawData.map(r => ({ day: parseInt(r.day), count: Number(r.count) }))
    }

    async getCustomerCountByMonthInYear(userId: number, year: number): Promise<MonthlyCount[]> {
        const rawData = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .select("MONTH(customer.createdAt)", "month")
            .addSelect("COUNT(DISTINCT customer.id)", "count")
            .where("cs.userId = :userId", { userId })
            .andWhere("YEAR(customer.createdAt) = :year", { year })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany()
        return rawData.map(r => ({ month: parseInt(r.month), total: Number(r.count) }))
    }

    async getRedemptionStatusCounts(
        userId: number,
        types: string[]
    ): Promise<{ status: string; count: number }[]> {
        const rawData = await this.redemptionRepository.createQueryBuilder("redemption")
            .select("redemption.status", "status")
            .addSelect("COUNT(redemption.id)", "count")
            .where("redemption.userId = :userId", { userId })
            .andWhere("redemption.type IN (:...types)", { types })
            .groupBy("redemption.status")
            .getRawMany()
        return rawData.map(r => ({ status: r.status, count: Number(r.count) }))
    }

    async getGlobalUserTotal(): Promise<number> {
        return await this.userRepository.count()
    }

    async getGlobalCustomerTotal(): Promise<number> {
        return await this.customerRepository.count()
    }

    async getGlobalCustomerServiceTotal(): Promise<number> {
        return await this.customerServiceRepository.count()
    }

    async getGlobalRewardTotal(): Promise<number> {
        const result = await this.rewardRepository.createQueryBuilder("reward")
            .select("SUM(reward.point)", "total")
            .getRawOne()
        return Number(result?.total || 0)
    }
}
