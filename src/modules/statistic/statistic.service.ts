import { AppDataSource } from "../../config/database"
import { Customer } from "../customer/entities/customer.entity"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { Point } from "../point/entities/point.entity"
import { Reward } from "../reward/entities/reward.entity"
import { Repository } from "typeorm"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export class StatisticService {
    private customerRepository: Repository<Customer>
    private customerServiceRepository: Repository<CustomerService>
    private pointRepository: Repository<Point>
    private rewardRepository: Repository<Reward>

    constructor() {
        this.customerRepository = AppDataSource.getRepository(Customer)
        this.customerServiceRepository = AppDataSource.getRepository(CustomerService)
        this.pointRepository = AppDataSource.getRepository(Point)
        this.rewardRepository = AppDataSource.getRepository(Reward)
    }

    async getCount(userId: number) {
        const [customer, customerService, point] = await Promise.all([
            this.customerRepository.count({ where: { userId } }),
            this.customerServiceRepository.count({
                where: {
                    customer: { userId }
                },
                relations: ["customer"]
            }),
            this.pointRepository.findOne({ where: { userId } })
        ])

        return {
            customer,
            customerService,
            point: point?.value ?? 0
        }
    }

    async getMonthlyPoints(userId: number) {
        const year = new Date().getFullYear()
        
        const rawData = await this.rewardRepository.createQueryBuilder("reward")
            .innerJoin("reward.customerService", "cs")
            .innerJoin("cs.customer", "customer")
            .select("MONTH(reward.createdAt)", "month")
            .addSelect("SUM(reward.point)", "total")
            .where("customer.userId = :userId", { userId })
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
                .select("DAY(customer.createdAt)", "day")
                .addSelect("COUNT(*)", "count")
                .where("customer.userId = :userId", { userId })
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
            .select("MONTH(customer.createdAt)", "month")
            .addSelect("COUNT(*)", "count")
            .where("customer.userId = :userId", { userId })
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
