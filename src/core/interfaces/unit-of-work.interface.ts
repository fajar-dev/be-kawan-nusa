import { EntityManager } from "typeorm"
import { AppDataSource } from "../../config/database"

/**
 * Unit of Work interface — abstracts transaction management.
 *
 * Services depend on this interface (not AppDataSource directly),
 * making them testable and decoupled from TypeORM.
 */
export interface IUnitOfWork {
    /**
     * Execute work inside a database transaction.
     * Automatically commits on success, rolls back on error.
     */
    runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T>

    /**
     * Get the default entity manager (for non-transactional operations).
     */
    getManager(): EntityManager
}

/**
 * TypeORM implementation of UnitOfWork.
 */
export class TypeOrmUnitOfWork implements IUnitOfWork {
    async runInTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
        return AppDataSource.manager.transaction(work)
    }

    getManager(): EntityManager {
        return AppDataSource.manager
    }
}
