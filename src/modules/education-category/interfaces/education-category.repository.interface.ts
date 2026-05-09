import { EducationCategory } from "../entities/education-category.entity"

export interface IEducationCategoryRepository {
    findAll(): Promise<EducationCategory[]>
}
