import { Catalog } from "./entities/catalog.entity"
import { ICatalogRepository } from "./interfaces/catalog.repository.interface"
import { NotFoundException } from "../../core/exceptions/base"
import { minio } from "../../core/helpers/minio"
import { CatalogType } from "./catalog.enum"

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = "",
        categoryIds?: number[],
        types?: string[]
    ): Promise<{ data: Catalog[]; total: number }> {
        return await this.repository.findAll(page, limit, q, categoryIds, types)
    }

    async getById(id: number): Promise<Catalog | null> {
        return await this.repository.findById(id)
    }

    async create(data: {
        categoryId: number
        name: string
        type?: CatalogType
        description?: string
        point?: number
        expiredDate?: string
        imageFile?: any
    }): Promise<Catalog> {
        let image: string | undefined = undefined
        const file = data.imageFile
        if (file && file instanceof File && file.size > 0) {
            const rawExt = file.type.split("/")[1]
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `catalog/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
            const buffer = Buffer.from(await file.arrayBuffer())
            await minio.upload(filename, buffer, file.type)
            image = filename
        }

        const catalog = new Catalog()
        catalog.categoryId = data.categoryId
        catalog.name = data.name
        catalog.type = data.type || CatalogType.PRODUCT
        catalog.description = data.description
        catalog.point = data.point || 0
        catalog.expiredDate = data.expiredDate ? new Date(data.expiredDate) : undefined
        catalog.image = image
        return await this.repository.save(catalog)
    }

    async update(id: number, data: {
        categoryId?: number
        name?: string
        type?: CatalogType
        description?: string
        point?: number
        expiredDate?: string
        imageFile?: any
    }): Promise<Catalog> {
        const catalog = await this.repository.findById(id)
        if (!catalog) {
            throw new NotFoundException("Catalog item not found")
        }

        if (data.categoryId !== undefined) catalog.categoryId = data.categoryId
        if (data.name !== undefined) catalog.name = data.name
        if (data.type !== undefined) catalog.type = data.type
        if (data.description !== undefined) catalog.description = data.description
        if (data.point !== undefined) catalog.point = data.point
        if (data.expiredDate !== undefined) catalog.expiredDate = data.expiredDate ? new Date(data.expiredDate) : undefined

        if (data.imageFile !== undefined) {
            let newImage: string | undefined = undefined
            const file = data.imageFile
            if (file && file instanceof File && file.size > 0) {
                const rawExt = file.type.split("/")[1]
                const ext = rawExt === "jpeg" ? "jpg" : rawExt
                const filename = `catalog/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
                const buffer = Buffer.from(await file.arrayBuffer())
                await minio.upload(filename, buffer, file.type)
                newImage = filename
            } else if (typeof file === "string" && file === "") {
                newImage = ""
            }

            if (newImage !== undefined) {
                if (catalog.image && catalog.image !== newImage) {
                    try {
                        await minio.delete(catalog.image)
                    } catch (err) {
                        console.error("[Catalog] Failed to delete old image from MinIO:", err)
                    }
                }
                catalog.image = newImage === "" ? undefined : newImage
            }
        }

        return await this.repository.save(catalog)
    }

    async delete(id: number): Promise<void> {
        const catalog = await this.repository.findById(id)
        if (!catalog) {
            throw new NotFoundException("Catalog item not found")
        }

        if (catalog.image) {
            try {
                await minio.delete(catalog.image)
            } catch (err) {
                console.error("[Catalog] Failed to delete image from MinIO:", err)
            }
        }

        await this.repository.delete(id)
    }

    async uploadImage(file: File): Promise<string> {
        const rawExt = file.type.split("/")[1]
        const ext = rawExt === "jpeg" ? "jpg" : rawExt
        const filename = `catalog/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        await minio.upload(filename, buffer, file.type)
        return minio.getProxyUrl(filename)
    }
}
