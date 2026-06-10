import { Employee } from "./entities/employee.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { EntityManager } from "typeorm"
import { IEmployeeRepository } from "./interfaces/employee.repository.interface"

export class EmployeeService {
    constructor(private readonly repository: IEmployeeRepository) {}

    async getById(id: number): Promise<Employee> {
        const employee = await this.repository.findById(id)
        if (!employee) {
            throw new NotFoundException("Employee not found")
        }
        return employee
    }

    async getByEmployeeId(employeeId: string): Promise<Employee | null> {
        return await this.repository.findByEmployeeId(employeeId)
    }

    async getByEmail(email: string): Promise<Employee | null> {
        return await this.repository.findByEmail(email)
    }

    async save(data: Partial<Employee>, manager?: EntityManager): Promise<Employee> {
        return await this.repository.save(data, manager)
    }
}
