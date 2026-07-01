import { Point } from "../entities/point.entity"

export class PointSerializer {
    static single(point: Point) {
        return {
            id: point.id,
            customerServiceId: point.customerServiceId,
            price: Number(point.price),
            expiredDate: point.expiredDate,
            point: Number(point.point),
            remainingPoint: Number(point.remainingPoint),
            isExpired: new Date(point.expiredDate).toISOString().split('T')[0] <= new Date().toISOString().split('T')[0],
            type: point.type,
            customerService: point.customerService ? {
                id: point.customerService.id,
                serviceCode: point.customerService.serviceCode,
                activationDate: point.customerService.activationDate,
                startDate: point.customerService.startDate,
                endDate: point.customerService.endDate,
            } : null,
            service: point.customerService?.service ? {
                code: point.customerService.service.code,
                name: point.customerService.service.name,
            } : null,
            customer: point.customerService?.customer ? {
                id: point.customerService.customer.id,
                name: point.customerService.customer.name,
            } : null,
            createdAt: point.createdAt,
        }
    }

    static collection(data: Point[]) {
        return data.map(point => this.single(point))
    }

    static summary(point: { value: number } | null) {
        if (!point) return { value: 0 }
        return { value: Number(point.value) }
    }
}
