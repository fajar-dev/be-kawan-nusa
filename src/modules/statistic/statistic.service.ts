import { AppDataSource } from "../../config/database"
import { Customer } from "../customer/entities/customer.entity"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { Point } from "../point/entities/point.entity"
import { Reward } from "../reward/entities/reward.entity"
import { Repository } from "typeorm"

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

        // Fill in missing months with zero, only up to current month
        const currentMonth = new Date().getMonth() + 1
        const monthlyData = Array.from({ length: currentMonth }, (_, i) => ({
            month: i + 1,
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
}
