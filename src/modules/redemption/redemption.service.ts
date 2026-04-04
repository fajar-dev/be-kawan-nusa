import { AppDataSource } from "../../config/database"
import { Redemption } from "./entities/redemption.entity"
import { WithdrawRedemption } from "./entities/withdraw-redemption.entity"
import { VoucherRedemption } from "./entities/voucher-redemption.entity"
import { ProductRedemption } from "./entities/product-redemption.entity"
import { User } from "../user/entities/user.entity"
import { Catalog } from "../catalog/entities/catalog.entity"
import { RedemptionType, RedemptionStatus } from "./redemption.enum"
import { PointHelper } from "../../core/helpers/point"
import { calculateWithdrawal } from "../../core/helpers/withdraw"
import { Repository } from "typeorm"
import { NotFoundException } from "../../core/exceptions/base"

export class RedemptionService {
    private repository: Repository<Redemption>

    constructor() {
        this.repository = AppDataSource.getRepository(Redemption)
    }

    async getAll(userId: number, page: number, limit: number) {
        const [data, total] = await this.repository.findAndCount({
            where: { userId },
            relations: [
                "withdrawRedemption", 
                "voucherRedemption", "voucherRedemption.catalog",
                "productRedemption", "productRedemption.catalog"
            ],
            order: { createdAt: "DESC" },
            take: limit,
            skip: (page - 1) * limit
        })

        return { data, total }
    }

    async getById(id: number, userId: number) {
        const redemption = await this.repository.findOne({
            where: { id, userId },
            relations: [
                "user", 
                "withdrawRedemption", 
                "voucherRedemption", "voucherRedemption.catalog",
                "productRedemption", "productRedemption.catalog"
            ]
        })

        if (!redemption) {
            throw new NotFoundException("Redemption record not found")
        }

        return redemption
    }

    async createCash(userId: number, pointsUsed: number, notes?: string) {
        return await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            // 1. Calculate and deduct points
            await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            // 2. Create cash redemption detail
            const { tax, payout } = calculateWithdrawal(pointsUsed)
            const withdraw = manager.create(WithdrawRedemption, {
                bankName: user.bankName,
                accountNumber: user.accountNumber,
                accountHolderName: user.accountHolderName,
                payout,
                tax
            })
            const savedWithdraw = await manager.save(withdraw)

            // 3. Create parent record
            const redempNo = await this.generateRedempNo()
            const redemption = manager.create(Redemption, {
                redempNo, userId, pointsUsed, type: RedemptionType.CASH,
                status: RedemptionStatus.PENDING, notes,
                withdrawRedemptionId: savedWithdraw.id
            })

            return await manager.save(redemption)
        })
    }

    async createVoucher(userId: number, catalogId: number, notes?: string) {
        return await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            const catalog = await manager.findOne(Catalog, { where: { id: catalogId } })
            if (!catalog) throw new NotFoundException("Catalog item not found")

            const pointsUsed = Number(catalog.point)

            // 1. Deduct points
            await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            // 2. Create voucher redemption detail
            const voucher = manager.create(VoucherRedemption, {
                catalogId,
                name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                email: user.email
            })
            const savedVoucher = await manager.save(voucher)

            // 3. Create parent record
            const redempNo = await this.generateRedempNo()
            const redemption = manager.create(Redemption, {
                redempNo, userId, pointsUsed, type: RedemptionType.VOUCHER,
                status: RedemptionStatus.PENDING, notes,
                voucherRedemptionId: savedVoucher.id
            })

            return await manager.save(redemption)
        })
    }

    async createProduct(userId: number, catalogId: number, address: string, notes?: string) {
        return await AppDataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            const catalog = await manager.findOne(Catalog, { where: { id: catalogId } })
            if (!catalog) throw new NotFoundException("Catalog item not found")

            const pointsUsed = Number(catalog.point)

            // 1. Deduct points
            await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            // 2. Create product redemption detail
            const product = manager.create(ProductRedemption, {
                catalogId,
                name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                email: user.email,
                phone: user.phone,
                address
            })
            const savedProduct = await manager.save(product)

            // 3. Create parent record
            const redempNo = await this.generateRedempNo()
            const redemption = manager.create(Redemption, {
                redempNo, userId, pointsUsed, type: RedemptionType.PRODUCT,
                status: RedemptionStatus.PENDING, notes,
                productRedemptionId: savedProduct.id
            })

            return await manager.save(redemption)
        })
    }

    private async generateRedempNo(): Promise<string> {
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`
        
        // Find latest for the day
        const latest = await this.repository.createQueryBuilder("redemption")
            .where("redemption.redempNo LIKE :prefix", { prefix: `RED-${dateStr}-%` })
            .orderBy("redemption.redempNo", "DESC")
            .getOne()

        let sequence = 1
        if (latest) {
            const parts = latest.redempNo.split("-")
            sequence = parseInt(parts[parts.length - 1]) + 1
        }

        const sequenceStr = String(sequence).padStart(4, '0')
        return `RED-${dateStr}-${sequenceStr}`
    }
}
