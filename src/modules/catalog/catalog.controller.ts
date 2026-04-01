import { Context } from 'hono'
import { CatalogService } from './catalog.service'
import { ApiResponse } from '../../core/helpers/response'
import { CatalogSerializer } from './serializers/catalog.serialize'

export class CatalogController {
    private service: CatalogService

    constructor() {
        this.service = new CatalogService()
    }

    async index(c: Context) {
        const categoryId = Number(c.req.query('categoryId')) || undefined
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""

        const { data, total } = await this.service.getAll(categoryId, page, limit, q)
        
        return ApiResponse.paginate(
            c, 
            CatalogSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Catalog retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param('id'))
        const catalog = await this.service.getById(id)
        if (!catalog) {
            return ApiResponse.error(c, "Catalog item not found", 404)
        }
        return ApiResponse.success(c, CatalogSerializer.single(catalog), "Catalog item retrieved successfully")
    }
}
