import { Template } from "../entities/template.entity";
import { minio } from "../../../core/helpers/minio";

export class TemplateSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo
        }
        return await minio.getPresignedUrl(photo)
    }

    static async single(item: Template) {
        return {
            id: item.id,
            name: item.name,
            thumbnail: await this.resolvePhotoUrl(item.thumbnail),
            description: item.description,
            png: await this.resolvePhotoUrl(item.png),
            jpg: await this.resolvePhotoUrl(item.jpg),
            mp4: await this.resolvePhotoUrl(item.mp4),
            psd: await this.resolvePhotoUrl(item.psd),
            isActive: item.isActive,
            createdAt: item.createdAt
        }
    }

    static async collection(items: Template[]) {
        return Promise.all(items.map(item => this.single(item)))
    }
}
