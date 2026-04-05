export enum RedemptionType {
    CASH = 'cash',
    VOUCHER = 'voucher',
    PRODUCT = 'product'
}

export enum RedemptionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export enum Shipper {
    JNE = 'jne',
    JNT = 'jnt',
    SICEPAT = 'sicepat',
    NINJA = 'ninja',
    WAHANA = 'wahana',
    POS = 'pos',
    OTHERS = 'others'
}
