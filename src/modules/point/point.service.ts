import { AppDataSource } from "../../config/database"
import { Point } from "./entities/point.entity"

export class PointService {
    private repository = AppDataSource.getRepository(Point)

    async getByUserId(userId: number) {
        return await this.repository.findOne({
            where: { userId }
        })
    }
}
