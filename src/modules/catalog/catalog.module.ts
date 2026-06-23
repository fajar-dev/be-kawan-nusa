import { TypeOrmCatalogRepository } from "./repositories/typeorm-catalog.repository"
import { CatalogService } from "./catalog.service"
import { CatalogController } from "./catalog.controller"

const repository = new TypeOrmCatalogRepository()
const service = new CatalogService(repository)
export const catalogController = new CatalogController(service)
