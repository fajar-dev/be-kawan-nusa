import { EducationVideo } from "../entities/education-video.entity";
import { minio } from "../../../core/helpers/minio";

export class EducationVideoSerializer {
   private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(item: EducationVideo) {
        return {
            id: item.id,
            title: item.title,
            url: item.url,
            thumbnail: await this.resolvePhotoUrl(item.thumbnail),
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

    static async collection(items: EducationVideo[]) {
        return Promise.all(items.map(item => this.single(item)))
    }
}
