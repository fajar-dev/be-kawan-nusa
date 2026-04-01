export class PointSerializer {
    /**
     * Point data is now a simple object with a value property.
     */
    static single(point: { value: number } | null) {
        if (!point) return {
            value: 0
        }

        return {
            value: Number(point.value)
        }
    }
}
