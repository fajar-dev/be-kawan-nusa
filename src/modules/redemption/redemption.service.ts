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
import { BadValidatorException, NotFoundException } from "../../core/exceptions/base"

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

    async create(userId: number, data: any) {
        return await AppDataSource.transaction(async (manager) => {
            let pointsUsed = 0
            const user = await manager.findOne(User, { where: { id: userId } })
            if (!user) throw new NotFoundException("User not found")

            // 1. Determine points used and fetch details if needed
            if (data.type === RedemptionType.CASH) {
                pointsUsed = Number(data.pointsUsed)
            } else if (data.type === RedemptionType.VOUCHER) {
                const catalog = await manager.findOne(Catalog, { where: { id: data.voucherDetails.catalogId } })
                if (!catalog) throw new NotFoundException("Catalog item not found")
                pointsUsed = Number(catalog.point)
            } else if (data.type === RedemptionType.PRODUCT) {
                const catalog = await manager.findOne(Catalog, { where: { id: data.productDetails.catalogId } })
                if (!catalog) throw new NotFoundException("Catalog item not found")
                pointsUsed = Number(catalog.point)
            }

            // 2. Deduct points via FIFO
            await PointHelper.subtractPointsFIFO(manager, userId, pointsUsed)

            // 3. Create detail record based on type
            let withdrawRedempId, voucherRedempId, productRedempId
            
            if (data.type === RedemptionType.CASH) {
                const { tax, payout } = calculateWithdrawal(pointsUsed)
                const cashData = {
                    bankName: user.bankName,
                    accountNumber: user.accountNumber,
                    accountHolderName: user.accountHolderName,
                    payout,
                    tax
                }
                const withdraw = manager.create(WithdrawRedemption, cashData)
                const savedWithdraw = await manager.save(withdraw)
                withdrawRedempId = savedWithdraw.id
            } else if (data.type === RedemptionType.VOUCHER) {
                const voucherData = {
                    catalogId: data.voucherDetails.catalogId,
                    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                    email: user.email
                }
                const voucher = manager.create(VoucherRedemption, voucherData)
                const savedVoucher = await manager.save(voucher)
                voucherRedempId = savedVoucher.id
            } else if (data.type === RedemptionType.PRODUCT) {
                const productData = {
                    catalogId: data.productDetails.catalogId,
                    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
                    email: user.email,
                    phone: user.phone,
                    address: data.productDetails.address
                }
                const product = manager.create(ProductRedemption, productData)
                const savedProduct = await manager.save(product)
                productRedempId = savedProduct.id
            } else {
                throw new BadValidatorException("Invalid redemption type")
            }

            // 3. Create parent redemption record
            const redempNo = await this.generateRedempNo()
            const redemption = manager.create(Redemption, {
                redempNo,
                userId,
                pointsUsed,
                type: data.type,
                status: RedemptionStatus.PENDING,
                notes: data.notes,
                withdrawRedemptionId: withdrawRedempId,
                voucherRedemptionId: voucherRedempId,
                productRedemptionId: productRedempId
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
