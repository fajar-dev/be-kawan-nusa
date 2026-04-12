import { EducationArticle } from "../entities/education-article.entity";

export class EducationArticleSerializer {
    static single(item: EducationArticle) {
        return {
            id: item.id,
            title: item.title,
            content: item.content,
            image: item.image,
            author: item.author,
            readingTime: this.calculateReadingTime(item.content),
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
