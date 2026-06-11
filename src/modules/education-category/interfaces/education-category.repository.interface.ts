import { EducationCategory } from "../entities/education-category.entity"

export interface IEducationCategoryRepository {
    findAll(): Promise<EducationCategory[]>
    findById(id: number): Promise<EducationCategory | null>
    save(category: EducationCategory): Promise<EducationCategory>
    delete(id: number): Promise<void>
}
