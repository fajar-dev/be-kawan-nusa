import { Point } from "../entities/point.entity"

export class PointSerializer {
    static single(point: Point | null) {
        if (!point) return {
            value: 0
        }

        return {
            value: point.value
        }
    }
}
