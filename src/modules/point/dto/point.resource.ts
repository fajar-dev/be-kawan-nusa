import { Point } from "../entities/point.entity"

export class PointResource {
    static single(point: Point | null) {
        if (!point) return {
            value: 0,
            expiredDate: null
        }

        return {
            value: point.value,
            expiredDate: point.expiredDate
        }
    }
}
