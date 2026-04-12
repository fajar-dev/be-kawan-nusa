import { Context } from 'hono'
import { EducationVideoService } from './education-video.service'
import { ApiResponse } from '../../core/helpers/response'
import { EducationVideoSerializer } from './serializers/education-video.serialize'
import { NotFoundException } from '../../core/exceptions/base'

export class EducationVideoController {
    private service: EducationVideoService

    constructor() {
        this.service = new EducationVideoService()
    }

    async index(c: Context) {
        const user = c.get('user')
        const page = Number(c.req.query('page')) || 1
        const limit = Number(c.req.query('limit')) || 10
        const categoryId = c.req.query('categoryId') ? Number(c.req.query('categoryId')) : undefined
        const q = c.req.query('q') || ""
        const isViewParam = c.req.query('isView')
        const isView = isViewParam !== undefined ? isViewParam === 'true' : undefined
        
        const { data, total } = await this.service.getAll(categoryId, page, limit, q, user?.id, isView)
        
        return ApiResponse.paginate(
            c, 
            EducationVideoSerializer.collection(data), 
            total, 
            page, 
            limit, 
            "Education videos retrieved successfully"
        )
    }

    async show(c: Context) {
        const user = c.get('user')
        const id = Number(c.req.param('id'))
        const video = await this.service.getById(id, user?.id)
        
        return ApiResponse.success(c, EducationVideoSerializer.single(video), "Education video details retrieved successfully")
    }
}
