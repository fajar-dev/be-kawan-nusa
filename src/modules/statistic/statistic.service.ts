import { AppDataSource } from "../../config/database"
import { Customer } from "../customer/entities/customer.entity"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { Reward } from "../reward/entities/reward.entity"
import { PointService } from "../point/point.service"
import { Repository } from "typeorm"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export class StatisticService {
    private customerRepository: Repository<Customer>
    private customerServiceRepository: Repository<CustomerService>
    private rewardRepository: Repository<Reward>
    private pointService: PointService

    constructor() {
        this.customerRepository = AppDataSource.getRepository(Customer)
        this.customerServiceRepository = AppDataSource.getRepository(CustomerService)
        this.rewardRepository = AppDataSource.getRepository(Reward)
        this.pointService = new PointService()
    }

    async getCount(userId: number) {
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonth = lastMonthDate.getMonth() + 1
        const lastYear = lastMonthDate.getFullYear()

        // 1. Customer Counts
        const customerTotalRaw = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .where("cs.userId = :userId", { userId })
            .select("COUNT(DISTINCT customer.id)", "total")
            .getRawOne()
        const customerTotal = Number(customerTotalRaw?.total || 0)
        
        const customerCurrentMonthRaw = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(customer.createdAt) = :month", { month: currentMonth })
            .andWhere("YEAR(customer.createdAt) = :year", { year: currentYear })
            .select("COUNT(DISTINCT customer.id)", "total")
            .getRawOne()
        const customerCurrentMonth = Number(customerCurrentMonthRaw?.total || 0)
            
        const customerLastMonthRaw = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(customer.createdAt) = :month", { month: lastMonth })
            .andWhere("YEAR(customer.createdAt) = :year", { year: lastYear })
            .select("COUNT(DISTINCT customer.id)", "total")
            .getRawOne()
        const customerLastMonth = Number(customerLastMonthRaw?.total || 0)

        // 2. Customer Service Counts
        const csTotal = await this.customerServiceRepository.count({
            where: { userId }
        })
        
        const csCurrentMonth = await this.customerServiceRepository.createQueryBuilder("cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(cs.referenceDate) = :month", { month: currentMonth })
            .andWhere("YEAR(cs.referenceDate) = :year", { year: currentYear })
            .getCount()
            
        const csLastMonth = await this.customerServiceRepository.createQueryBuilder("cs")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(cs.referenceDate) = :month", { month: lastMonth })
            .andWhere("YEAR(cs.referenceDate) = :year", { year: lastYear })
            .getCount()

        // 3. Point (Current Available Balance via PointService for consistency and cleanup)
        const pointData = await this.pointService.getByUserId(userId)
        const pointTotal = pointData.value

        const pointCurrentMonthRaw = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("SUM(reward.point)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(reward.createdAt) = :month", { month: currentMonth })
            .andWhere("YEAR(reward.createdAt) = :year", { year: currentYear })
            .getRawOne()
        const pointCurrentMonth = Number(pointCurrentMonthRaw?.total || 0)

        const pointLastMonthRaw = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("SUM(reward.point)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("MONTH(reward.createdAt) = :month", { month: lastMonth })
            .andWhere("YEAR(reward.createdAt) = :year", { year: lastYear })
            .getRawOne()
        const pointLastMonth = Number(pointLastMonthRaw?.total || 0)

        return {
            customer: {
                value: customerTotal,
                achievement: this.calculateAchievement(customerCurrentMonth, customerLastMonth)
            },
            customerService: {
                value: csTotal,
                achievement: this.calculateAchievement(csCurrentMonth, csLastMonth)
            },
            point: {
                value: pointTotal,
                achievement: this.calculateAchievement(pointCurrentMonth, pointLastMonth)
            }
        }
    }

    private calculateAchievement(current: number, previous: number) {
        if (previous === 0) {
            return {
                percentage: current > 0 ? 100 : 0,
                isUp: current > 0
            }
        }
        
        const diff = current - previous
        const percentage = Math.abs(Math.round((diff / previous) * 100))
        
        return {
            percentage,
            isUp: diff >= 0
        }
    }

    async getMonthlyPoints(userId: number) {
        const year = new Date().getFullYear()
        
        const rawData = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .select("MONTH(reward.createdAt)", "month")
            .addSelect("SUM(reward.point)", "total")
            .where("cs.userId = :userId", { userId })
            .andWhere("YEAR(reward.createdAt) = :year", { year })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany()

        const currentMonth = new Date().getMonth() + 1
        const monthlyData = Array.from({ length: currentMonth }, (_, i) => ({
            label: MONTH_NAMES[i],
            total: 0
        }))

        rawData.forEach(item => {
            const monthIndex = parseInt(item.month) - 1
            if (monthlyData[monthIndex]) {
                monthlyData[monthIndex].total = Number(item.total)
            }
        })


        return monthlyData
    }

    async getCustomerStatistics(userId: number, type: string = "yearly") {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        if (type === "monthly") {
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

            const currentDay = now.getDate()
            const result = Array.from({ length: currentDay }, (_, i) => ({
                label: `${i + 1} ${MONTH_NAMES[month - 1]}`,
                count: 0
            }))

            rawData.forEach(item => {
                const dayIndex = parseInt(item.day) - 1
                if (result[dayIndex]) {
                    result[dayIndex].count = Number(item.count)
                }
            })

            return result
        }

        // Yearly view (default)
        const rawData = await this.customerRepository.createQueryBuilder("customer")
            .innerJoin("customer.services", "cs")
            .select("MONTH(customer.createdAt)", "month")
            .addSelect("COUNT(DISTINCT customer.id)", "count")
            .where("cs.userId = :userId", { userId })
            .andWhere("YEAR(customer.createdAt) = :year", { year })
            .groupBy("month")
            .orderBy("month", "ASC")
            .getRawMany()

        const currentMonthNumbers = now.getMonth() + 1
        const result = Array.from({ length: currentMonthNumbers }, (_, i) => ({
            label: MONTH_NAMES[i],
            count: 0
        }))

        rawData.forEach(item => {
            const monthIndex = parseInt(item.month) - 1
            if (result[monthIndex]) {
                result[monthIndex].count = Number(item.count)
            }
        })

        return result
    }
}
