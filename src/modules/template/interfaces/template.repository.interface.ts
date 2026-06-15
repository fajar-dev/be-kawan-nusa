import { Template } from "../entities/template.entity"

export interface ITemplateRepository {
    findAll(page: number, limit: number, q: string, showAll?: boolean): Promise<{ data: Template[]; total: number }>
    findById(id: number, showAll?: boolean): Promise<Template | null>
    save(template: Template): Promise<Template>
    delete(id: number): Promise<void>
}
