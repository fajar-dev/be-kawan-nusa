import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { ReportDownloadHistory } from "../entities/report-download-history.entity"
import { CreateReportDownloadHistoryData, IReportDownloadHistoryRepository } from "../interfaces/report-download-history.repository.interface"

export class ReportDownloadHistoryRepository implements IReportDownloadHistoryRepository {
    private readonly repository: Repository<ReportDownloadHistory>

    constructor() {
        this.repository = AppDataSource.getRepository(ReportDownloadHistory)
    }

    async create(data: CreateReportDownloadHistoryData): Promise<ReportDownloadHistory> {
        const entity = this.repository.create(data)
        return await this.repository.save(entity)
    }

    async findAll(page: number, limit: number, q?: string): Promise<{ data: ReportDownloadHistory[]; total: number }> {
        const query = this.repository.createQueryBuilder("history")
            .leftJoinAndSelect("history.requestedBy", "requestedBy")

        if (q) {
            query.andWhere("(history.periodLabel LIKE :q OR requestedBy.name LIKE :q)", { q: `%${q}%` })
        }

        query.orderBy("history.createdAt", "DESC")
            .take(limit)
            .skip((page - 1) * limit)

        const [data, total] = await query.getManyAndCount()
        return { data, total }
    }
}
