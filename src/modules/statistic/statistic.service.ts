import { PointService } from "../point/point.service"
import { RedemptionType, RedemptionStatus } from "../redemption/redemption.enum"
import { IStatisticRepository } from "./interfaces/statistic.repository.interface"

const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export class StatisticService {
    constructor(
        private readonly repository: IStatisticRepository,
        private readonly pointService: PointService
    ) {}

    async getCount(userId: number) {
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonth = lastMonthDate.getMonth() + 1
        const lastYear = lastMonthDate.getFullYear()

        const [
            customerTotal,
            customerCurrentMonth,
            customerLastMonth,
            csTotal,
            csCurrentMonth,
            csLastMonth,
            pointData,
            pointCurrentMonth,
            pointLastMonth,
        ] = await Promise.all([
            this.repository.getCustomerTotal(userId),
            this.repository.getCustomerCountByMonth(userId, currentMonth, currentYear),
            this.repository.getCustomerCountByMonth(userId, lastMonth, lastYear),
            this.repository.getCustomerServiceTotal(userId),
            this.repository.getCustomerServiceCountByMonth(userId, currentMonth, currentYear),
            this.repository.getCustomerServiceCountByMonth(userId, lastMonth, lastYear),
            this.pointService.getByUserId(userId),
            this.repository.getPointsByMonth(userId, currentMonth, currentYear),
            this.repository.getPointsByMonth(userId, lastMonth, lastYear),
        ])

        return {
            customer: {
                value: customerTotal,
                achievement: this.calculateAchievement(customerCurrentMonth, customerLastMonth),
            },
            customerService: {
                value: csTotal,
                achievement: this.calculateAchievement(csCurrentMonth, csLastMonth),
            },
            point: {
                value: pointData.value,
                achievement: this.calculateAchievement(pointCurrentMonth, pointLastMonth),
            },
        }
    }

    async getAdminSummary() {
        const [
            userTotal,
            customerTotal,
            csTotal,
            rewardTotal,
        ] = await Promise.all([
            this.repository.getGlobalUserTotal(),
            this.repository.getGlobalCustomerTotal(),
            this.repository.getGlobalCustomerServiceTotal(),
            this.repository.getGlobalRewardTotal(),
        ])

        return {
            user: {
                value: userTotal,
            },
            customer: {
                value: customerTotal,
            },
            customerService: {
                value: csTotal,
            },
            point: {
                value: rewardTotal,
            },
        }
    }


    async getMonthlyPoints(userId: number) {
        const year = new Date().getFullYear()
        const rawData = await this.repository.getMonthlyPointSums(userId, year)

        const currentMonth = new Date().getMonth() + 1
        const monthlyData = Array.from({ length: currentMonth }, (_, i) => ({
            label: MONTH_NAMES[i],
            total: 0,
        }))

        rawData.forEach(item => {
            const idx = item.month - 1
            if (monthlyData[idx]) monthlyData[idx].total = item.total
        })

        return monthlyData
    }

    async getCustomerStatistics(userId: number, type: string = "yearly") {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1

        if (type === "monthly") {
            const rawData = await this.repository.getCustomerCountByDayInMonth(userId, year, month)
            const currentDay = now.getDate()
            const result = Array.from({ length: currentDay }, (_, i) => ({
                label: `${i + 1} ${MONTH_NAMES[month - 1]}`,
                count: 0,
            }))
            rawData.forEach(item => {
                const idx = item.day - 1
                if (result[idx]) result[idx].count = item.count
            })
            return result
        }

        const rawData = await this.repository.getCustomerCountByMonthInYear(userId, year)
        const currentMonthNum = now.getMonth() + 1
        const result = Array.from({ length: currentMonthNum }, (_, i) => ({
            label: MONTH_NAMES[i],
            count: 0,
        }))
        rawData.forEach(item => {
            const idx = item.month - 1
            if (result[idx]) result[idx].count = item.total
        })
        return result
    }

    async getRedemptionRewardStats(userId: number) {
        const types = [RedemptionType.PRODUCT, RedemptionType.VOUCHER]
        const rawData = await this.repository.getRedemptionStatusCounts(userId, types)

        const statusCounts = Object.values(RedemptionStatus).reduce((acc, status) => {
            acc[status] = 0
            return acc
        }, {} as Record<string, number>)

        rawData.forEach(item => {
            if (statusCounts[item.status] !== undefined) {
                statusCounts[item.status] = item.count
            }
        })

        return Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
    }

    private calculateAchievement(current: number, previous: number) {
        if (previous === 0) {
            return { percentage: current > 0 ? 100 : 0, isUp: current > 0 }
        }
        const diff = current - previous
        return {
            percentage: Math.abs(Math.round((diff / previous) * 100)),
            isUp: diff >= 0,
        }
    }
}
