import { Catalog } from "./entities/catalog.entity"
import { CatalogStockHistory } from "./entities/catalog-stock-history.entity"
import { ICatalogRepository } from "./interfaces/catalog.repository.interface"
import { NotFoundException } from "../../core/exceptions/base"
import { minio } from "../../core/helpers/minio"
import { CatalogType, StockHistoryType } from "./catalog.enum"
import { AppDataSource } from "../../config/database"

export class CatalogService {
    constructor(private readonly repository: ICatalogRepository) {}

    private get stockHistoryRepo() {
        return AppDataSource.getRepository(CatalogStockHistory)
    }

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = "",
        categoryIds?: number[],
        types?: string[],
        sort?: string,
        order?: string
    ): Promise<{ data: Catalog[]; total: number }> {
        return await this.repository.findAll(page, limit, q, categoryIds, types, sort, order)
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
        stock?: number
        expiredDate?: string
        createdById?: number
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
        catalog.stock = data.stock ?? 0
        catalog.expiredDate = data.expiredDate ? new Date(data.expiredDate) : undefined
        catalog.createdById = data.createdById
        catalog.image = image
        const saved = await this.repository.save(catalog)

        // Record initial stock history
        if (saved.stock > 0) {
            await this.recordStockHistory({
                catalogId: saved.id,
                type: StockHistoryType.INITIAL,
                quantity: saved.stock,
                stockBefore: 0,
                stockAfter: saved.stock,
                notes: "Stok awal",
                createdById: data.createdById,
            })
        }

        return saved
    }

    async update(id: number, data: {
        categoryId?: number
        name?: string
        type?: CatalogType
        description?: string
        point?: number
        stock?: number
        expiredDate?: string
        createdById?: number
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

        // Stock = sisa. Admin edits sisa directly, stockUsed not touched.
        if (data.stock !== undefined && data.stock !== catalog.stock) {
            const stockBefore = catalog.stock
            const stockAfter = data.stock
            const delta = stockAfter - stockBefore

            let historyType: StockHistoryType
            let notes: string
            if (delta > 0) {
                historyType = StockHistoryType.ADDITION
                notes = `Penambahan stok +${delta}`
            } else {
                historyType = StockHistoryType.OPNAME
                notes = `Stock opname ${delta}`
            }

            catalog.stock = data.stock

            await this.recordStockHistory({
                catalogId: id,
                type: historyType,
                quantity: delta,
                stockBefore,
                stockAfter,
                notes,
                createdById: data.createdById,
            })
        }

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

    async recordStockHistory(data: {
        catalogId: number
        type: StockHistoryType
        quantity: number
        stockBefore: number
        stockAfter: number
        notes?: string
        createdById?: number
    }): Promise<CatalogStockHistory> {
        const history = this.stockHistoryRepo.create(data)
        return await this.stockHistoryRepo.save(history)
    }

    async getStockHistory(
        catalogId: number,
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: CatalogStockHistory[]; total: number }> {
        const [data, total] = await this.stockHistoryRepo.findAndCount({
            where: { catalogId },
            relations: ["createdBy"],
            order: { createdAt: "DESC" },
            take: limit,
            skip: (page - 1) * limit,
        })
        return { data, total }
    }
}
