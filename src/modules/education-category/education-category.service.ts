import { EducationCategory } from "./entities/education-category.entity"
import { IEducationCategoryRepository } from "./interfaces/education-category.repository.interface"
import { NotFoundException } from "../../core/exceptions/base"

export class EducationCategoryService {
    constructor(private readonly repository: IEducationCategoryRepository) {}

    async getAll(): Promise<EducationCategory[]> {
        return await this.repository.findAll()
    }

    async create(name: string): Promise<EducationCategory> {
        const category = new EducationCategory()
        category.name = name
        return await this.repository.save(category)
    }

    async update(id: number, name: string): Promise<EducationCategory> {
        const category = await this.repository.findById(id)
        if (!category) {
            throw new NotFoundException("Education category not found")
        }
        category.name = name
        return await this.repository.save(category)
    }

    async delete(id: number): Promise<void> {
        const category = await this.repository.findById(id)
        if (!category) {
            throw new NotFoundException("Education category not found")
        }
        await this.repository.delete(id)
    }
}
