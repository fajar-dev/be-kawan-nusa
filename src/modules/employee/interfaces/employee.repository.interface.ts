import { EntityManager } from "typeorm"
import { Employee } from "../entities/employee.entity"

export interface IEmployeeRepository {
    findById(id: number): Promise<Employee | null>
    findByEmployeeId(employeeId: string): Promise<Employee | null>
    findByEmail(email: string): Promise<Employee | null>
    save(data: Partial<Employee>, manager?: EntityManager): Promise<Employee>
    merge(entity: Employee, data: Partial<Employee>): Employee
}
