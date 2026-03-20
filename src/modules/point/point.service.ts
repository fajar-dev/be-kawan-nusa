import { AppDataSource } from "../../config/database"
import { Point } from "./entities/point.entity"
import { EntityManager, Repository } from "typeorm"

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
}
