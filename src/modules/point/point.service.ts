import { AppDataSource } from "../../config/database"
import { Point } from "./entities/point.entity"
import { EntityManager, Repository } from "typeorm"
import { BadValidationException } from "../../core/exceptions/base"

export class PointService {
    private repository: Repository<Point>

    constructor() {
        this.repository = AppDataSource.getRepository(Point)
    }

    async getByUserId(userId: number) {
        return await this.repository.findOne({
            where: { userId }
        })
    }

    async create(data: Partial<Point>, manager?: EntityManager) {
        return manager ? manager.save(Point, data) : this.repository.save(data)
    }

    async addPoints(userId: number, points: number, manager: EntityManager) {
        const pointRecord = await manager.findOneBy(Point, { userId })
        const amount = Number(points)

        if (pointRecord) {
            pointRecord.value = Number(pointRecord.value) + amount
            return await manager.save(pointRecord)
        } else {
            const newPoint = manager.create(Point, { userId, value: amount })
            return await manager.save(newPoint)
        }
    }

    async subtractPoints(userId: number, points: number, manager: EntityManager) {
        const pointRecord = await manager.findOneBy(Point, { userId })
        const amount = Number(points)

        if (!pointRecord || Number(pointRecord.value) < amount) {
            throw new BadValidationException("Insufficient point balance")
        }

        pointRecord.value = Number(pointRecord.value) - amount
        return await manager.save(pointRecord)
    }
}
