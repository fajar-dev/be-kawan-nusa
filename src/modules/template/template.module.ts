import { TypeOrmTemplateRepository } from "./repositories/typeorm-template.repository"
import { TemplateService } from "./template.service"
import { TemplateController } from "./template.controller"

const repository = new TypeOrmTemplateRepository()
const service = new TemplateService(repository)
export const templateController = new TemplateController(service)
