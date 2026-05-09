import { TypeOrmCatalogCategoryRepository } from "./repositories/typeorm-catalog-category.repository"
import { CatalogCategoryService } from "./catalog-category.service"
import { CatalogCategoryController } from "./catalog-category.controller"

const catalogCategoryRepository = new TypeOrmCatalogCategoryRepository()
const catalogCategoryService = new CatalogCategoryService(catalogCategoryRepository)

export const catalogCategoryController = new CatalogCategoryController(catalogCategoryService)
