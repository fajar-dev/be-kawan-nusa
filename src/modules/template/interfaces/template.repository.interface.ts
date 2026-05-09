import { Template } from "../entities/template.entity"

export interface ITemplateRepository {
    findAll(page: number, limit: number, q: string): Promise<{ data: Template[]; total: number }>
    findById(id: number): Promise<Template | null>
}
