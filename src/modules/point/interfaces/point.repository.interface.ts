import { Point } from "../entities/point.entity"

export interface PointListFilters {
    startDate?: string
    endDate?: string
    types?: string[]
}

export interface IPointRepository {
    findAllByUserId(
        userId: number, page: number, limit: number, q: string,
        sort: string, order: string, filters?: PointListFilters
    ): Promise<{ data: Point[]; total: number }>

    findAllByCustomerId(
        customerId: string, userId: number, page: number, limit: number,
        q: string, sort: string, order: string, filters?: PointListFilters
    ): Promise<{ data: Point[]; total: number }>

    getTotalAvailablePoints(userId: number): Promise<number>

    save(data: Partial<Point>, manager?: any): Promise<Point>

    saveMany(points: Point[], manager?: any): Promise<void>
}
