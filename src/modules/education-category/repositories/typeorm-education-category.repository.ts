import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { EducationCategory } from "../entities/education-category.entity"
import { IEducationCategoryRepository } from "../interfaces/education-category.repository.interface"

export class TypeOrmEducationCategoryRepository implements IEducationCategoryRepository {
    private readonly repository: Repository<EducationCategory>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationCategory)
    }

    async findAll(): Promise<EducationCategory[]> {
        return await this.repository.find({ order: { name: "ASC" } })
    }
}
