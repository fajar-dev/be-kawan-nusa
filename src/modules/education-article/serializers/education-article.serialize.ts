import { EducationArticle } from "../entities/education-article.entity";
import { minio } from "../../../core/helpers/minio";

export class EducationArticleSerializer {
    static single(item: EducationArticle) {
        return {
            id: item.id,
            title: item.title,
            content: item.content,
            image: item.image ? minio.getProxyUrl(item.image) : null,
            author: item.author,
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

    static collection(items: EducationArticle[]) {
        return items.map(item => this.single(item))
    }
}
