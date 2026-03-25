import { AppDataSource } from "../../config/database"
import { Withdraw } from "./entities/withdraw.entity"
import { Repository, Brackets } from "typeorm"
import { Point } from "../point/entities/point.entity"
import { PointService } from "../point/point.service"
import { BadValidationException, NotFoundException } from "../../core/exceptions/base"
import { calculateWithdrawal } from "../../core/helpers/withdraw"

export class WithdrawService {
    private repository: Repository<Withdraw>
    private pointService: PointService

    constructor() {
        this.repository = AppDataSource.getRepository(Withdraw)
        this.pointService = new PointService()
    }

    async getAll(userId: number, page: number, limit: number, q: string = "", sort: string = "createdAt", order: string = "DESC", startDate?: string, endDate?: string) {
        const skip = (page - 1) * limit
        
        const query = this.repository.createQueryBuilder("withdrawal")
            .where("withdrawal.user_id = :userId", { userId })

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("withdrawal.bank_name LIKE :q")
                  .orWhere("withdrawal.account_number LIKE :q")
                  .orWhere("withdrawal.account_holder_name LIKE :q")
            }), { q: `%${q}%` })
        }

        if (startDate) {
            query.andWhere("withdrawal.createdAt >= :startDate", { startDate })
        }

        if (endDate) {
            query.andWhere("withdrawal.createdAt <= :endDate", { endDate })
        }

        query.orderBy(`withdrawal.${sort}`, order.toUpperCase() as any)

        const [data, total] = await query
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        return { data, total }
    }

    async getById(id: number, userId: number) {
        const withdraw = await this.repository.findOne({
            where: { id, userId },
            relations: ["user"]
        })

        if (!withdraw) {
            throw new NotFoundException("Withdrawal record not found")
        }

        return withdraw
    }

    async create(data: Partial<Withdraw>) {
        return await AppDataSource.transaction(async (manager) => {
            const userId = data.userId as number
            const point = Number(data.point || 0)

            // Deduct points from user's balance
            await this.pointService.subtractPoints(userId, point, manager)

            const { tax, payout } = calculateWithdrawal(point)

            const withdraw = manager.create(Withdraw, {
                ...data,
                tax,
                payout
            })
            const savedWithdraw = await manager.save(withdraw)

            return savedWithdraw
        })
    }
}
