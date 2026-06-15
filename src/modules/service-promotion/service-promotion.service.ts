import { ServicePromotion } from "./entities/service-promotion.entity"
import { IServicePromotionRepository } from "./interfaces/service-promotion.repository.interface"
import { minio } from "../../core/helpers/minio"
import { NotFoundException } from "../../core/exceptions/base"

export class ServicePromotionService {
    constructor(private readonly repository: IServicePromotionRepository) {}

    async getAll(
        page: number = 1,
        limit: number = 10,
        q: string = "",
        showAll?: boolean
    ): Promise<{ data: ServicePromotion[]; total: number }> {
        return await this.repository.findAll(page, limit, q, showAll)
    }

    async getById(id: number): Promise<ServicePromotion | null> {
        return await this.repository.findById(id)
    }

    async create(data: {
        serviceCode?: string
        title: string
        description?: string
        url: string
        startPeriod?: string
        endPeriod?: string
        isActive?: boolean
        imageFile?: any
    }): Promise<ServicePromotion> {
        let image: string | undefined = undefined
        const file = data.imageFile
        if (file && file instanceof File && file.size > 0) {
            const rawExt = file.type.split("/")[1] || "bin"
            const ext = rawExt === "jpeg" ? "jpg" : rawExt
            const filename = `promotions/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
            const buffer = Buffer.from(await file.arrayBuffer())
            await minio.upload(filename, buffer, file.type || "application/octet-stream")
            image = filename
        }

        const promotion = new ServicePromotion()
        promotion.serviceCode = data.serviceCode
        promotion.title = data.title
        promotion.description = data.description
        promotion.url = data.url
        promotion.startPeriod = data.startPeriod ? new Date(data.startPeriod) : undefined
        promotion.endPeriod = data.endPeriod ? new Date(data.endPeriod) : undefined
        promotion.isActive = data.isActive ?? true
        promotion.image = image

        return await this.repository.save(promotion)
    }

    async update(id: number, data: {
        serviceCode?: string | null
        title?: string
        description?: string
        url?: string
        startPeriod?: string | null
        endPeriod?: string | null
        isActive?: boolean
        imageFile?: any
    }): Promise<ServicePromotion> {
        const promotion = await this.repository.findById(id)
        if (!promotion) {
            throw new NotFoundException("Service promotion not found")
        }

        if (data.serviceCode !== undefined) promotion.serviceCode = data.serviceCode === null ? undefined : data.serviceCode
        if (data.title !== undefined) promotion.title = data.title
        if (data.description !== undefined) promotion.description = data.description
        if (data.url !== undefined) promotion.url = data.url
        if (data.startPeriod !== undefined) promotion.startPeriod = data.startPeriod ? new Date(data.startPeriod) : undefined
        if (data.endPeriod !== undefined) promotion.endPeriod = data.endPeriod ? new Date(data.endPeriod) : undefined
        if (data.isActive !== undefined) promotion.isActive = data.isActive

        if (data.imageFile !== undefined) {
            let newImage: string | undefined = undefined
            const file = data.imageFile
            if (file && file instanceof File && file.size > 0) {
                const rawExt = file.type.split("/")[1] || "bin"
                const ext = rawExt === "jpeg" ? "jpg" : rawExt
                const filename = `promotions/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
                const buffer = Buffer.from(await file.arrayBuffer())
                await minio.upload(filename, buffer, file.type || "application/octet-stream")
                newImage = filename
            } else if (typeof file === "string" && file === "") {
                newImage = ""
            }

            if (newImage !== undefined) {
                if (promotion.image && promotion.image !== newImage) {
                    try {
                        await minio.delete(promotion.image)
                    } catch (err) {
                        console.error("[Promotion] Failed to delete old image from MinIO:", err)
                    }
                }
                promotion.image = newImage === "" ? undefined : newImage
            }
        }

        return await this.repository.save(promotion)
    }

    async delete(id: number): Promise<void> {
        const promotion = await this.repository.findById(id)
        if (!promotion) {
            throw new NotFoundException("Service promotion not found")
        }

        if (promotion.image) {
            try {
                await minio.delete(promotion.image)
            } catch (err) {
                console.error("[Promotion] Failed to delete image from MinIO:", err)
            }
        }

        await this.repository.delete(id)
    }
}
