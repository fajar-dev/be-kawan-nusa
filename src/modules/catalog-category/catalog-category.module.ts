import { CatalogCategoryRepository } from "./repositories/catalog-category.repository"
import { CatalogCategoryService } from "./catalog-category.service"
import { CatalogCategoryController } from "./catalog-category.controller"

const repository = new CatalogCategoryRepository()
const service = new CatalogCategoryService(repository)
export const catalogCategoryController = new CatalogCategoryController(service)
