import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { RateCommission } from "../entities/rate-commission.entity"
import { PointType } from "../../point/point.enum"
import { IRateCommissionRepository, RateCommissionListFilters } from "../interfaces/rate-commission.repository.interface"

export class RateCommissionRepository implements IRateCommissionRepository {
    private readonly repository: Repository<RateCommission>

    constructor() {
        this.repository = AppDataSource.getRepository(RateCommission)
    }

    async findAll(page: number, limit: number, q: string, sort: string, order: string, filters: RateCommissionListFilters = {}): Promise<{ data: RateCommission[]; total: number }> {
        const query = this.repository.createQueryBuilder("rc")
            .leftJoinAndSelect("rc.service", "service")
            .leftJoinAndSelect("rc.createdBy", "createdBy")

        if (filters.category) {
            query.andWhere("rc.category = :category", { category: filters.category })
        }

        if (filters.type) {
            query.andWhere("rc.type = :type", { type: filters.type })
        }

        if (filters.startDateFrom) {
            query.andWhere("rc.startDate >= :startDateFrom", { startDateFrom: filters.startDateFrom })
        }

        if (filters.startDateTo) {
            query.andWhere("rc.startDate <= :startDateTo", { startDateTo: filters.startDateTo })
        }

        if (q) {
            query.andWhere("(service.name LIKE :q OR service.code LIKE :q)", { q: `%${q}%` })
        }

        const sortMap: Record<string, string> = {
            service: "service.name",
            value: "rc.value",
            type: "rc.type",
            startDate: "rc.startDate",
            endDate: "rc.endDate",
            createdAt: "rc.createdAt",
        }
        const sortField = sortMap[sort] || "rc.createdAt"
        const sortOrder = (order || "").toUpperCase() === "ASC" ? "ASC" : "DESC"
        query.orderBy(sortField, sortOrder)

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async findById(id: number): Promise<RateCommission | null> {
        return await this.repository.createQueryBuilder("rc")
            .leftJoinAndSelect("rc.service", "service")
            .leftJoinAndSelect("rc.createdBy", "createdBy")
            .where("rc.id = :id", { id })
            .getOne()
    }

    async findByServiceAndCategory(serviceCode: string, category: PointType): Promise<RateCommission | null> {
        return await this.repository.findOne({ where: { serviceCode, category } })
    }

    async findTakenServiceCodes(category: PointType): Promise<string[]> {
        const rows = await this.repository.find({ where: { category }, select: { serviceCode: true } })
        return rows.map(r => r.serviceCode)
    }

    async save(data: Partial<RateCommission>): Promise<RateCommission> {
        const entity = this.repository.create(data)
        return await this.repository.save(entity)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
