import { Context } from 'hono'
import { CatalogCategoryService } from './catalog-category.service'
import { ApiResponse } from '../../core/helpers/response'
import { CatalogCategorySerializer } from './serializers/catalog-category.serialize'

export class CatalogCategoryController {
    private service: CatalogCategoryService

    constructor() {
        this.service = new CatalogCategoryService()
    }

    async index(c: Context) {
        const categories = await this.service.getAll()
        return ApiResponse.success(c, CatalogCategorySerializer.collection(categories), "Catalog categories retrieved successfully")
    }
}
