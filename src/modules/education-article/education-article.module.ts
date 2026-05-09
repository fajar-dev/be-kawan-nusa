import { TypeOrmEducationArticleRepository } from "./repositories/typeorm-education-article.repository"
import { EducationArticleService } from "./education-article.service"
import { EducationArticleController } from "./education-article.controller"

const educationArticleRepository = new TypeOrmEducationArticleRepository()
const educationArticleService = new EducationArticleService(educationArticleRepository)

export const educationArticleController = new EducationArticleController(educationArticleService)
