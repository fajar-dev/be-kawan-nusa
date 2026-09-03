import { RateCommission } from "./entities/rate-commission.entity"
import { RateCommissionHistory } from "./entities/rate-commission-history.entity"
import { PointType } from "../point/point.enum"
import { RateCommissionValueType, RateCommissionHistoryAction } from "./rate-commission.enum"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { IRateCommissionRepository, RateCommissionListFilters } from "./interfaces/rate-commission.repository.interface"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"

// MySQL "date" columns come back from TypeORM as plain "YYYY-MM-DD" strings, not
// Date instances — normalize either shape to a date string.
function toDateStr(value: Date | string | null | undefined): string | null {
    if (!value) return null
    return typeof value === "string" ? value : value.toISOString().slice(0, 10)
}

export interface RateCommissionInput {
    serviceCode: string
    category: PointType
    value: number
    type: RateCommissionValueType
    startDate: string
    endDate?: string | null
    notes?: string | null
}

export class RateCommissionService {
    constructor(
        private readonly repository: IRateCommissionRepository,
        private readonly unitOfWork: IUnitOfWork,
    ) {}

    async getAll(page: number, limit: number, q: string, sort: string, order: string, filters: RateCommissionListFilters = {}): Promise<{ data: RateCommission[]; total: number }> {
        return await this.repository.findAll(page, limit, q, sort, order, filters)
    }

    async getById(id: number): Promise<RateCommission> {
        const item = await this.repository.findById(id)
        if (!item) throw new NotFoundException("Rate commission not found")
        return item
    }

    async getTakenServiceCodes(category: PointType): Promise<string[]> {
        return await this.repository.findTakenServiceCodes(category)
    }

    async create(data: RateCommissionInput, createdById: number): Promise<RateCommission> {
        const existing = await this.repository.findByServiceAndCategory(data.serviceCode, data.category)
        if (existing) {
            throw new BadRequestException("Service ini sudah punya rate komisi untuk kategori tersebut — silakan edit yang sudah ada")
        }

        this.validateDateRange(data.startDate, data.endDate)
        this.validateValue(data.type, data.value)

        const saved = await this.repository.save({
            serviceCode: data.serviceCode,
            category: data.category,
            value: data.value,
            type: data.type,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            notes: data.notes || null,
            createdById,
        })

        const historyRepo = this.unitOfWork.getManager().getRepository(RateCommissionHistory)
        await historyRepo.save({
            rateCommissionId: saved.id,
            action: RateCommissionHistoryAction.CREATED,
            toValue: data.value,
            toType: data.type,
            toStartDate: new Date(data.startDate),
            toEndDate: data.endDate ? new Date(data.endDate) : null,
            notes: data.notes || null,
            changedById: createdById,
        })

        // save() doesn't hydrate relations from a plain data object — re-fetch
        // so the response includes service/createdBy.
        return await this.getById(saved.id)
    }

    async update(id: number, data: Partial<RateCommissionInput>, changedById: number): Promise<RateCommission> {
        const existing = await this.getById(id)

        const nextServiceCode = data.serviceCode ?? existing.serviceCode
        const nextCategory = data.category ?? existing.category

        if (nextServiceCode !== existing.serviceCode || nextCategory !== existing.category) {
            const conflict = await this.repository.findByServiceAndCategory(nextServiceCode, nextCategory)
            if (conflict && conflict.id !== id) {
                throw new BadRequestException("Service ini sudah punya rate komisi untuk kategori tersebut — silakan edit yang sudah ada")
            }
        }

        const fromStartDate = toDateStr(existing.startDate)!
        const fromEndDate = toDateStr(existing.endDate)
        const nextStartDate = data.startDate !== undefined ? data.startDate : fromStartDate
        const nextEndDate = data.endDate !== undefined ? data.endDate : fromEndDate
        this.validateDateRange(nextStartDate, nextEndDate)

        const fromType = existing.type
        const fromValue = Number(existing.value)
        const nextType = data.type ?? existing.type
        const nextValue = data.value ?? Number(existing.value)
        this.validateValue(nextType, nextValue)

        const fromNotes = existing.notes || null
        const nextNotes = data.notes !== undefined ? (data.notes || null) : fromNotes

        const changed = nextValue !== fromValue || nextType !== fromType || nextStartDate !== fromStartDate || nextEndDate !== fromEndDate || nextNotes !== fromNotes
        if (changed) {
            const historyRepo = this.unitOfWork.getManager().getRepository(RateCommissionHistory)
            await historyRepo.save({
                rateCommissionId: id,
                action: RateCommissionHistoryAction.UPDATED,
                fromValue,
                toValue: nextValue,
                fromType,
                toType: nextType,
                fromStartDate: new Date(fromStartDate),
                toStartDate: new Date(nextStartDate),
                fromEndDate: fromEndDate ? new Date(fromEndDate) : null,
                toEndDate: nextEndDate ? new Date(nextEndDate) : null,
                notes: nextNotes,
                changedById,
            })
        }

        existing.serviceCode = nextServiceCode
        existing.category = nextCategory
        if (data.value !== undefined) existing.value = data.value
        if (data.type !== undefined) existing.type = data.type
        if (data.startDate !== undefined) existing.startDate = new Date(data.startDate)
        if (data.endDate !== undefined) existing.endDate = data.endDate ? new Date(data.endDate) : null
        if (data.notes !== undefined) existing.notes = data.notes || null

        return await this.repository.save(existing)
    }

    async getHistories(rateCommissionId: number): Promise<RateCommissionHistory[]> {
        const historyRepo = this.unitOfWork.getManager().getRepository(RateCommissionHistory)
        return await historyRepo.find({
            where: { rateCommissionId },
            relations: ["changedBy", "rateCommission", "rateCommission.service"],
            order: { createdAt: "DESC" },
        })
    }

    /**
     * Global change log across all rate commissions — search by service name/code
     * or the name of whoever made the change.
     */
    async getAllHistories(page: number, limit: number, q: string): Promise<{ data: RateCommissionHistory[]; total: number }> {
        const historyRepo = this.unitOfWork.getManager().getRepository(RateCommissionHistory)
        const query = historyRepo.createQueryBuilder("h")
            .leftJoinAndSelect("h.changedBy", "changedBy")
            .leftJoinAndSelect("h.rateCommission", "rateCommission")
            .leftJoinAndSelect("rateCommission.service", "service")

        if (q) {
            query.andWhere("(service.name LIKE :q OR service.code LIKE :q OR changedBy.name LIKE :q)", { q: `%${q}%` })
        }

        query.orderBy("h.createdAt", "DESC")

        const [data, total] = await query.take(limit).skip((page - 1) * limit).getManyAndCount()
        return { data, total }
    }

    async delete(id: number): Promise<void> {
        await this.getById(id)
        await this.repository.delete(id)
    }

    private validateDateRange(startDate: string, endDate?: string | null): void {
        if (endDate && new Date(endDate) < new Date(startDate)) {
            throw new BadRequestException("Tanggal berakhir tidak boleh sebelum tanggal mulai berlaku")
        }
    }

    private validateValue(type: RateCommissionValueType, value: number): void {
        if (type === RateCommissionValueType.PERCENTAGE && value > 100) {
            throw new BadRequestException("Nilai persentase tidak boleh lebih dari 100")
        }
    }
}
