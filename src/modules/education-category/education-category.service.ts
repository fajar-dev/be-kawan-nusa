import { EducationCategory } from "./entities/education-category.entity"
import { IEducationCategoryRepository } from "./interfaces/education-category.repository.interface"

export class EducationCategoryService {
    constructor(private readonly repository: IEducationCategoryRepository) {}

    async getAll(): Promise<EducationCategory[]> {
        return await this.repository.findAll()
    }
}
