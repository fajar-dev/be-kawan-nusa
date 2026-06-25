import { CatalogRepository } from "./repositories/catalog.repository"
import { CatalogService } from "./catalog.service"
import { CatalogController } from "./catalog.controller"

const repository = new CatalogRepository()
const service = new CatalogService(repository)
export const catalogController = new CatalogController(service)
