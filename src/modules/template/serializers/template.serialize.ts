import { Template } from "../entities/template.entity";

export class TemplateSerializer {
    static single(item: Template) {
        return {
            id: item.id,
            name: item.name,
            thumbnail: item.thumbnail,
            description: item.description,
            png: item.png,
            jpg: item.jpg,
            mp4: item.mp4,
            psd: item.psd,
            isActive: item.isActive,
            createdAt: item.createdAt
        }
    }

    static collection(items: Template[]) {
        return items.map(item => this.single(item))
    }
}
