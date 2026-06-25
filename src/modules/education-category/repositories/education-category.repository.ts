import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { EducationCategory } from "../entities/education-category.entity"
import { IEducationCategoryRepository } from "../interfaces/education-category.repository.interface"

export class EducationCategoryRepository implements IEducationCategoryRepository {
    private readonly repository: Repository<EducationCategory>

    constructor() {
        this.repository = AppDataSource.getRepository(EducationCategory)
    }

    async findAll(): Promise<EducationCategory[]> {
        return await this.repository.find({ order: { name: "ASC" } })
    }

    async findById(id: number): Promise<EducationCategory | null> {
        return await this.repository.findOne({ where: { id } })
    }

    async save(category: EducationCategory): Promise<EducationCategory> {
        return await this.repository.save(category)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
