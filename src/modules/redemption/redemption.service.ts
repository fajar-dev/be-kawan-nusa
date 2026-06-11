import { AppDataSource } from "../../config/database"
import { Redemption } from "./entities/redemption.entity"
import { RedemptionWithdraw } from "./entities/redemption-withdraw.entity"
import { RedemptionVoucher } from "./entities/redemption-voucher.entity"
import { RedemptionProduct } from "./entities/redemption-product.entity"
import { User } from "../user/entities/user.entity"
import { Catalog } from "../catalog/entities/catalog.entity"
import { RedemptionType, RedemptionStatus } from "./redemption.enum"
import { PointHelper } from "../../core/helpers/point"
import { calculateWithdrawal } from "../../core/helpers/withdraw"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { IRedemptionRepository, RedemptionListFilters } from "./interfaces/redemption.repository.interface"
import { generateWithdrawalNote } from "../../core/helpers/pdf"
import { minio } from "../../core/helpers/minio"

export class RedemptionService {
    constructor(private readonly repository: IRedemptionRepository) {}

    async getAll(
        userId: number,
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }> {
        return await this.repository.findAllByUserId(userId, page, limit, filters, sort, order)
    }

    async getCashList(
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }> {
        return await this.repository.findCashList(page, limit, filters, sort, order)
    }

    async getById(id: number, userId: number): Promise<Redemption> {
        const redemption = await this.repository.findByIdAndUserId(id, userId)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }
        return redemption
    }

    async getReceiptById(id: number, userId: number): Promise<Redemption> {
        const redemption = await this.repository.findReceiptByIdAndUserId(id, userId)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }
        return redemption
    }

    async createCash(userId: number, pointsUsed: number, notes?: string): Promise<Redemption> {
        const redemption = await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            const availablePoints = await PointHelper.getAvailablePoints(manager, userId)
            if (availablePoints < pointsUsed) {
                throw new BadRequestException(
                    `Insufficient point balance. Available: ${availablePoints}, Required: ${pointsUsed}`
                )
            }

            const rewardOutDetail = await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            const { tax, payout } = calculateWithdrawal(pointsUsed)
            const withdraw = manager.create(RedemptionWithdraw, {
                bankName: user.bankName,
                accountNumber: user.accountNumber,
                accountHolderName: user.accountHolderName,
                payout,
                tax,
            })
            const savedWithdraw = await manager.save(withdraw)

            const redempNo = await this.generateRedempNo()
            const r = manager.create(Redemption, {
                redempNo,
                userId,
                pointsUsed,
                type: RedemptionType.CASH,
                status: RedemptionStatus.PENDING,
                notes,
                rewardOutDetail,
                redemptionWithdrawId: savedWithdraw.id,
            })

            const saved = await manager.save(r)
            saved.user = user
            saved.redemptionWithdraw = savedWithdraw
            return saved
        })

        // Generate PDF and upload to MinIO (background)
        generateWithdrawalNote(redemption).then(async (pdfBuffer) => {
            const objectName = `receipts/${redemption.redempNo}.pdf`
            await minio.upload(objectName, pdfBuffer, "application/pdf")
            await AppDataSource.getRepository(RedemptionWithdraw).update(
                redemption.redemptionWithdrawId!,
                { receiptPath: objectName }
            )
        }).catch((err) => console.error("[Redemption] Failed to generate receipt PDF:", err))

        return redemption
    }

    async createVoucher(userId: number, catalogId: number, notes?: string): Promise<Redemption> {
        return await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            const catalog = await manager.findOne(Catalog, { where: { id: catalogId } })
            if (!catalog) throw new NotFoundException("Catalog item not found")

            const pointsUsed = Number(catalog.point)
            const availablePoints = await PointHelper.getAvailablePoints(manager, userId)
            if (availablePoints < pointsUsed) {
                throw new BadRequestException(
                    `Insufficient point balance. Available: ${availablePoints}, Required: ${pointsUsed}`
                )
            }

            const rewardOutDetail = await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            const voucher = manager.create(RedemptionVoucher, {
                catalogId,
                name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                email: user.email,
            })
            const savedVoucher = await manager.save(voucher)

            const redempNo = await this.generateRedempNo()
            const redemption = manager.create(Redemption, {
                redempNo,
                userId,
                pointsUsed,
                type: RedemptionType.VOUCHER,
                status: RedemptionStatus.PENDING,
                notes,
                rewardOutDetail,
                redemptionVoucherId: savedVoucher.id,
            })

            return await manager.save(redemption)
        })
    }

    async createProduct(userId: number, catalogId: number, address: string, notes?: string): Promise<Redemption> {
        return await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            const catalog = await manager.findOne(Catalog, { where: { id: catalogId } })
            if (!catalog) throw new NotFoundException("Catalog item not found")

            const pointsUsed = Number(catalog.point)
            const availablePoints = await PointHelper.getAvailablePoints(manager, userId)
            if (availablePoints < pointsUsed) {
                throw new BadRequestException(
                    `Insufficient point balance. Available: ${availablePoints}, Required: ${pointsUsed}`
                )
            }

            const rewardOutDetail = await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            const product = manager.create(RedemptionProduct, {
                catalogId,
                name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                email: user.email,
                phone: user.phone,
                address,
            })
            const savedProduct = await manager.save(product)

            const redempNo = await this.generateRedempNo()
            const redemption = manager.create(Redemption, {
                redempNo,
                userId,
                pointsUsed,
                type: RedemptionType.PRODUCT,
                status: RedemptionStatus.PENDING,
                notes,
                rewardOutDetail,
                redemptionProductId: savedProduct.id,
            })

            return await manager.save(redemption)
        })
    }

    async updateStatus(id: number, status: RedemptionStatus): Promise<Redemption> {
        const redemption = await this.repository.findById(id)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        redemption.status = status
        return await this.repository.save(redemption)
    }

    private async generateRedempNo(): Promise<string> {
        const date = new Date()
        const dateStr = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
        ].join("")

        const latestRedempNo = await this.repository.getLatestRedempNoByDate(dateStr)
        let sequence = 1
        if (latestRedempNo) {
            const parts = latestRedempNo.split("-")
            sequence = parseInt(parts[parts.length - 1]) + 1
        }

        return `RED-${dateStr}-${String(sequence).padStart(4, "0")}`
    }
}
