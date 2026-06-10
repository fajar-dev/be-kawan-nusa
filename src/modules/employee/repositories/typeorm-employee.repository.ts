import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Employee } from "../entities/employee.entity"
import { IEmployeeRepository } from "../interfaces/employee.repository.interface"

export class TypeOrmEmployeeRepository implements IEmployeeRepository {
    private readonly repository: Repository<Employee>

    constructor() {
        this.repository = AppDataSource.getRepository(Employee)
    }

    async findById(id: number): Promise<Employee | null> {
        return await this.repository.findOneBy({ id })
    }

    async findByEmployeeId(employeeId: string): Promise<Employee | null> {
        return await this.repository.findOneBy({ employeeId })
    }

    async findByEmail(email: string): Promise<Employee | null> {
        return await this.repository.findOneBy({ email })
    }

    async save(data: Partial<Employee>, manager?: EntityManager): Promise<Employee> {
        const repo = manager ? manager.getRepository(Employee) : this.repository
        return await repo.save(data)
    }

    merge(entity: Employee, data: Partial<Employee>): Employee {
        return this.repository.merge(entity, data)
    }
}
