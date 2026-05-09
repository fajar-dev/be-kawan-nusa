import { TypeOrmCatalogRepository } from "./repositories/typeorm-catalog.repository"
import { CatalogService } from "./catalog.service"
import { CatalogController } from "./catalog.controller"

const catalogRepository = new TypeOrmCatalogRepository()
const catalogService = new CatalogService(catalogRepository)

export const catalogController = new CatalogController(catalogService)
