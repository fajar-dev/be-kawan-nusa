import { EducationArticle } from "../entities/education-article.entity";
import { minio } from "../../../core/helpers/minio";

export class EducationArticleSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(item: EducationArticle) {
        return {
            id: item.id,
            title: item.title,
            content: item.content,
            image: await this.resolvePhotoUrl(item.image),
            author: item.author ? {
                name: item.author.name,
                employeeId: item.author.employeeId,
                photo: item.author.photo || null,
            } : null,
            readingTime: this.calculateReadingTime(item.content),
            isView: !!item.isViewed,
            categoryId: item.categoryId,
            category: item.category ? {
                id: item.category.id,
                name: item.category.name
            } : null,
            createdAt: item.createdAt
        }
    }

    private static calculateReadingTime(content: string): string {
        const wordsPerMinute = 200;
        const words = content.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} menit baca`;
    }

    static async collection(items: EducationArticle[]) {
        return Promise.all(items.map(item => this.single(item)))
    }
}
