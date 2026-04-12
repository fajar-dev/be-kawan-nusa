import { Context } from 'hono'
import { TemplateService } from './template.service'
import { ApiResponse } from '../../core/helpers/response'
import { TemplateSerializer } from './serializers/template.serialize'
import { NotFoundException } from '../../core/exceptions/base'

export class TemplateController {
    private service: TemplateService

    constructor() {
        this.service = new TemplateService()
    }

    async index(c: Context) {
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const q = c.req.query('q') || ""
        
        const { data, total } = await this.service.getAll(page, limit, q)
        
        return ApiResponse.paginate(
            c, 
            TemplateSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Templates retrieved successfully"
        )
    }

    async show(c: Context) {
        const id = Number(c.req.param('id'))
        const item = await this.service.getById(id)
        if (!item) throw new NotFoundException("Template not found")
        
        return ApiResponse.success(c, TemplateSerializer.single(item), "Template details retrieved successfully")
    }

    async download(c: Context) {
        const id = Number(c.req.param('id'))
        const type = c.req.query('type') as 'png' | 'jpg' | 'mp4' | 'psd'
        const item = await this.service.getById(id)
        
        if (!item) throw new NotFoundException("Template not found")
        
        const fileUrl = item[type]
        if (!fileUrl) throw new NotFoundException(`File for type ${type} not found`)

        return c.redirect(fileUrl)
    }
}
