import { AppDataSource } from "../../config/database"
import { Withdraw } from "./entities/withdraw.entity"
import { Repository, Brackets } from "typeorm"
import { Point } from "../point/entities/point.entity"
import { BadRequestException } from "../../core/exceptions/base"
import { calculateWithdrawal } from "../../core/helpers/withdraw"

export class WithdrawService {
    private repository: Repository<Withdraw>
    private pointRepository: Repository<Point>

    constructor() {
        this.repository = AppDataSource.getRepository(Withdraw)
        this.pointRepository = AppDataSource.getRepository(Point)
    }

    async getAll(userId: number, page: number, limit: number, q: string = "", sort: string = "createdAt", order: string = "DESC") {
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

        query.orderBy(`withdrawal.${sort}`, order.toUpperCase() as any)

        const [data, total] = await query
            .skip(skip)
            .take(limit)
            .getManyAndCount()

        return { data, total }
    }

    async create(data: Partial<Withdraw>) {
        return await AppDataSource.transaction(async (manager) => {
            const userId = data.userId as number
            const point = Number(data.point || 0)

            const userPoint = await manager.findOneBy(Point, { userId })
            if (!userPoint || userPoint.value < point) {
                throw new BadRequestException("Insufficient point balance")
            }

            const { tax, payout } = calculateWithdrawal(point)

            const withdraw = manager.create(Withdraw, {
                ...data,
                tax,
                payout
            })
            const savedWithdraw = await manager.save(withdraw)

            userPoint.value -= point
            await manager.save(userPoint)

            return savedWithdraw
        })
    }
}
