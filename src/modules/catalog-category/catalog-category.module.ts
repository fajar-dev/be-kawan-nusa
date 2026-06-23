import { TypeOrmCatalogCategoryRepository } from "./repositories/typeorm-catalog-category.repository"
import { CatalogCategoryService } from "./catalog-category.service"
import { CatalogCategoryController } from "./catalog-category.controller"

const repository = new TypeOrmCatalogCategoryRepository()
const service = new CatalogCategoryService(repository)
export const catalogCategoryController = new CatalogCategoryController(service)
