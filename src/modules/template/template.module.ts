import { TypeOrmTemplateRepository } from "./repositories/typeorm-template.repository"
import { TemplateService } from "./template.service"
import { TemplateController } from "./template.controller"

const templateRepository = new TypeOrmTemplateRepository()
const templateService = new TemplateService(templateRepository)

export const templateController = new TemplateController(templateService)
