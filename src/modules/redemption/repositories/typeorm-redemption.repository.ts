import { Brackets, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Redemption } from "../entities/redemption.entity"
import { RedemptionType } from "../redemption.enum"
import { IRedemptionRepository, RedemptionListFilters } from "../interfaces/redemption.repository.interface"

const REDEMPTION_RELATIONS = [
    "user",
    "redemptionWithdraw",
    "redemptionVoucher",
    "redemptionVoucher.catalog",
    "redemptionVoucher.catalog.category",
    "redemptionVoucher.detail",
    "redemptionProduct",
    "redemptionProduct.catalog",
    "redemptionProduct.catalog.category",
    "redemptionProduct.shipping",
]

export class TypeOrmRedemptionRepository implements IRedemptionRepository {
    private readonly repository: Repository<Redemption>

    constructor() {
        this.repository = AppDataSource.getRepository(Redemption)
    }

    async findAllByUserId(
        userId: number,
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }> {
        const query = this.repository.createQueryBuilder("redemption")
            .leftJoinAndSelect("redemption.redemptionWithdraw", "withdraw")
            .leftJoinAndSelect("redemption.redemptionVoucher", "voucher")
            .leftJoinAndSelect("voucher.catalog", "vCatalog")
            .leftJoinAndSelect("vCatalog.category", "vCategory")
            .leftJoinAndSelect("redemption.redemptionProduct", "product")
            .leftJoinAndSelect("product.catalog", "pCatalog")
            .leftJoinAndSelect("pCatalog.category", "pCategory")
            .leftJoinAndSelect("voucher.detail", "vDetail")
            .leftJoinAndSelect("product.shipping", "pShipping")
            .where("redemption.userId = :userId", { userId })

        if (filters.startDate) query.andWhere("redemption.createdAt >= :startDate", { startDate: filters.startDate })
        if (filters.endDate) query.andWhere("redemption.createdAt <= :endDate", { endDate: `${filters.endDate} 23:59:59` })
        if (filters.status?.length) query.andWhere("redemption.status IN (:...status)", { status: filters.status })
        if (filters.type?.length) query.andWhere("redemption.type IN (:...type)", { type: filters.type })

        if (filters.q) {
            query.andWhere(new Brackets(qb => {
                qb.where("redemption.redempNo LIKE :q")
                  .orWhere("redemption.notes LIKE :q")
                  .orWhere("vCatalog.name LIKE :q")
                  .orWhere("pCatalog.name LIKE :q")
                  .orWhere("voucher.name LIKE :q")
                  .orWhere("product.name LIKE :q")
                  .orWhere("vDetail.code LIKE :q")
                  .orWhere("pShipping.trackingNumber LIKE :q")
            }), { q: `%${filters.q}%` })
        }

        const sortAlias = sort.includes(".") ? sort : `redemption.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")
            .take(limit)
            .skip((page - 1) * limit)

        const [data, total] = await query.getManyAndCount()
        return { data, total }
    }

    async findCashList(
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }> {
        const query = this.repository.createQueryBuilder("redemption")
            .leftJoinAndSelect("redemption.user", "user")
            .leftJoinAndSelect("redemption.redemptionWithdraw", "withdraw")
            .where("redemption.type = :type", { type: RedemptionType.CASH })

        if (filters.startDate) query.andWhere("redemption.createdAt >= :startDate", { startDate: filters.startDate })
        if (filters.endDate) query.andWhere("redemption.createdAt <= :endDate", { endDate: `${filters.endDate} 23:59:59` })
        if (filters.status?.length) query.andWhere("redemption.status IN (:...status)", { status: filters.status })

        if (filters.q) {
            query.andWhere(new Brackets(qb => {
                qb.where("redemption.redempNo LIKE :q")
                  .orWhere("user.firstName LIKE :q")
                  .orWhere("user.lastName LIKE :q")
                  .orWhere("user.email LIKE :q")
                  .orWhere("withdraw.accountHolderName LIKE :q")
                  .orWhere("withdraw.bankName LIKE :q")
                  .orWhere("withdraw.accountNumber LIKE :q")
            }), { q: `%${filters.q}%` })
        }

        const sortAlias = sort.includes(".") ? sort : `redemption.${sort}`
        query.orderBy(sortAlias, order.toUpperCase() as "ASC" | "DESC")
            .take(limit)
            .skip((page - 1) * limit)

        const [data, total] = await query.getManyAndCount()
        return { data, total }
    }

    async findByIdAndUserId(id: number, userId: number): Promise<Redemption | null> {
        return await this.repository.findOne({ where: { id, userId }, relations: REDEMPTION_RELATIONS })
    }

    async findById(id: number): Promise<Redemption | null> {
        return await this.repository.findOne({ where: { id }, relations: REDEMPTION_RELATIONS })
    }

    async save(redemption: Redemption): Promise<Redemption> {
        return await this.repository.save(redemption)
    }

    async findReceiptByIdAndUserId(id: number, userId: number): Promise<Redemption | null> {
        return await this.repository.findOne({
            where: { id, userId, type: RedemptionType.CASH },
            relations: REDEMPTION_RELATIONS,
        })
    }

    async getLatestRedempNoByDate(dateStr: string): Promise<string | null> {
        const latest = await this.repository.createQueryBuilder("redemption")
            .where("redemption.redempNo LIKE :prefix", { prefix: `RED-${dateStr}-%` })
            .orderBy("redemption.redempNo", "DESC")
            .getOne()
        return latest?.redempNo ?? null
    }
}
