import { EntityManager } from "typeorm"

export interface IBaseRepository<T> {
    save(data: Partial<T>, manager?: EntityManager): Promise<T>
}
