import { EducationCategoryRepository } from "./repositories/education-category.repository"
import { EducationCategoryService } from "./education-category.service"
import { EducationCategoryController } from "./education-category.controller"

const repository = new EducationCategoryRepository()
const service = new EducationCategoryService(repository)
export const educationCategoryController = new EducationCategoryController(service)
