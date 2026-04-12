import { AppDataSource } from "../../config/database"
import { EducationCategory } from "./entities/education-category.entity"
import { Repository } from "typeorm"

export class EducationCategoryService {
    private repository: Repository<EducationCategory>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationCategory)
    }

    async getAll() {
        return await this.repository.find({
            order: { name: "ASC" }
        })
    }
}
