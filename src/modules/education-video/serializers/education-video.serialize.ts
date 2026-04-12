import { EducationVideo } from "../entities/education-video.entity";

export class EducationVideoSerializer {
    static single(item: EducationVideo) {
        return {
            id: item.id,
            title: item.title,
            url: item.url,
            thumbnail: item.thumbnail,
            description: item.description,
            author: item.author,
            isView: !!item.isViewed,
            categoryId: item.categoryId,
            category: item.category ? {
                id: item.category.id,
                name: item.category.name
            } : null,
            createdAt: item.createdAt
        }
    }

    static collection(items: EducationVideo[]) {
        return items.map(item => this.single(item))
    }
}
