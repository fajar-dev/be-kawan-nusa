import { AppDataSource } from "../../config/database"
import { Redemption } from "./entities/redemption.entity"
import { RedemptionWithdraw } from "./entities/redemption-withdraw.entity"
import { RedemptionVoucher } from "./entities/redemption-voucher.entity"
import { RedemptionVoucherDetail } from "./entities/redemption-voucher-detail.entity"
import { RedemptionProduct } from "./entities/redemption-product.entity"
import { RedemptionProductShipping } from "./entities/redemption-product-shipping.entity"
import { User } from "../user/entities/user.entity"
import { Catalog } from "../catalog/entities/catalog.entity"
import { RedemptionType, RedemptionStatus, Shipper } from "./redemption.enum"
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

    async getProductList(
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }> {
        return await this.repository.findProductList(page, limit, filters, sort, order)
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

    async completeCash(id: number): Promise<Redemption> {
        const redemption = await this.repository.findById(id)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        if (redemption.type !== RedemptionType.CASH) {
            throw new BadRequestException("Only cash redemptions can be marked as completed")
        }

        if (redemption.status === RedemptionStatus.COMPLETED) {
            throw new BadRequestException("Redemption is already completed")
        }

        if (redemption.status !== RedemptionStatus.PENDING && redemption.status !== RedemptionStatus.PROCESSING) {
            throw new BadRequestException(`Cannot complete redemption with status ${redemption.status}`)
        }

        redemption.status = RedemptionStatus.COMPLETED
        return await this.repository.save(redemption)
    }

    async processProduct(id: number, shipper: Shipper, trackingNumber: string): Promise<Redemption> {
        const redemption = await this.repository.findById(id)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        if (redemption.type !== RedemptionType.PRODUCT) {
            throw new BadRequestException("Only product redemptions can be processed")
        }

        if (redemption.status !== RedemptionStatus.PENDING) {
            throw new BadRequestException(`Cannot process redemption with status ${redemption.status}`)
        }

        if (!redemption.redemptionProductId) {
            throw new BadRequestException("Redemption product data not found")
        }

        return await AppDataSource.transaction(async (manager) => {
            const shipping = manager.create(RedemptionProductShipping, {
                redemptionProductId: redemption.redemptionProductId!,
                shipper,
                trackingNumber,
                shippedAt: new Date(),
            })
            await manager.save(shipping)

            redemption.status = RedemptionStatus.PROCESSING
            return await manager.save(redemption)
        })
    }

    async completeProduct(id: number): Promise<Redemption> {
        const redemption = await this.repository.findById(id)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        if (redemption.type !== RedemptionType.PRODUCT) {
            throw new BadRequestException("Only product redemptions can be marked as completed")
        }

        if (redemption.status !== RedemptionStatus.PROCESSING) {
            throw new BadRequestException(`Cannot complete redemption with status ${redemption.status}`)
        }

        redemption.status = RedemptionStatus.COMPLETED
        return await this.repository.save(redemption)
    }

    async getVoucherList(
        page: number,
        limit: number,
        filters: RedemptionListFilters,
        sort: string,
        order: string
    ): Promise<{ data: Redemption[]; total: number }> {
        return await this.repository.findVoucherList(page, limit, filters, sort, order)
    }

    async processVoucher(id: number, code: string, expiredDate?: string): Promise<Redemption> {
        const redemption = await this.repository.findById(id)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        if (redemption.type !== RedemptionType.VOUCHER) {
            throw new BadRequestException("Only voucher redemptions can be processed")
        }

        if (redemption.status !== RedemptionStatus.PENDING) {
            throw new BadRequestException(`Cannot process redemption with status ${redemption.status}`)
        }

        if (!redemption.redemptionVoucherId) {
            throw new BadRequestException("Redemption voucher data not found")
        }

        return await AppDataSource.transaction(async (manager) => {
            const detail = manager.create(RedemptionVoucherDetail, {
                redemptionVoucherId: redemption.redemptionVoucherId!,
                code,
                expiredDate: expiredDate ? new Date(expiredDate) : undefined,
            })
            await manager.save(detail)

            redemption.status = RedemptionStatus.PROCESSING
            return await manager.save(redemption)
        })
    }

    async completeVoucher(id: number): Promise<Redemption> {
        const redemption = await this.repository.findById(id)
        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        if (redemption.type !== RedemptionType.VOUCHER) {
            throw new BadRequestException("Only voucher redemptions can be marked as completed")
        }

        if (redemption.status !== RedemptionStatus.PROCESSING) {
            throw new BadRequestException(`Cannot complete redemption with status ${redemption.status}`)
        }

        redemption.status = RedemptionStatus.COMPLETED
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
