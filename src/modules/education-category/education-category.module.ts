import { TypeOrmEducationCategoryRepository } from "./repositories/typeorm-education-category.repository"
import { EducationCategoryService } from "./education-category.service"
import { EducationCategoryController } from "./education-category.controller"

const repository = new TypeOrmEducationCategoryRepository()
const service = new EducationCategoryService(repository)
export const educationCategoryController = new EducationCategoryController(service)
