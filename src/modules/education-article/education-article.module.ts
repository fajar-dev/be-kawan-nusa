import { TypeOrmEducationArticleRepository } from "./repositories/typeorm-education-article.repository"
import { EducationArticleService } from "./education-article.service"
import { EducationArticleController } from "./education-article.controller"

const repository = new TypeOrmEducationArticleRepository()
const service = new EducationArticleService(repository)
export const educationArticleController = new EducationArticleController(service)
