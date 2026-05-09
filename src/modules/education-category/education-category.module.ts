import { TypeOrmEducationCategoryRepository } from "./repositories/typeorm-education-category.repository"
import { EducationCategoryService } from "./education-category.service"
import { EducationCategoryController } from "./education-category.controller"

const educationCategoryRepository = new TypeOrmEducationCategoryRepository()
const educationCategoryService = new EducationCategoryService(educationCategoryRepository)

export const educationCategoryController = new EducationCategoryController(educationCategoryService)
