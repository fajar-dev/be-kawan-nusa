export interface MonthlyCount {
    month: number
    total: number
}

export interface IStatisticRepository {
    getCustomerTotal(userId: number): Promise<number>
    getCustomerCountByMonth(userId: number, month: number, year: number): Promise<number>
    getCustomerServiceTotal(userId: number): Promise<number>
    getCustomerServiceCountByMonth(userId: number, month: number, year: number): Promise<number>
    getPointsByMonth(userId: number, month: number, year: number): Promise<number>
    getMonthlyPointSums(userId: number, year: number): Promise<MonthlyCount[]>
    getCustomerCountByDayInMonth(userId: number, year: number, month: number): Promise<{ day: number; count: number }[]>
    getCustomerCountByMonthInYear(userId: number, year: number): Promise<MonthlyCount[]>
    getRedemptionStatusCounts(userId: number, types: string[]): Promise<{ status: string; count: number }[]>
    
    // Global/Admin Stats
    getGlobalUserTotal(): Promise<number>
    getGlobalCustomerTotal(): Promise<number>
    getGlobalCustomerServiceTotal(): Promise<number>
    getGlobalRewardTotal(): Promise<number>
}
