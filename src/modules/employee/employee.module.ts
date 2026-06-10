import { TypeOrmEmployeeRepository } from "./repositories/typeorm-employee.repository"
import { EmployeeService } from "./employee.service"

export const employeeRepository = new TypeOrmEmployeeRepository()
export const employeeService = new EmployeeService(employeeRepository)
