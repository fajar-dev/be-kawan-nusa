import { TemplateRepository } from "./repositories/template.repository"
import { TemplateService } from "./template.service"
import { TemplateController } from "./template.controller"

const repository = new TemplateRepository()
const service = new TemplateService(repository)
export const templateController = new TemplateController(service)
