import { TypeOrmEmployeeRepository } from "./repositories/typeorm-employee.repository"
import { EmployeeService } from "./employee.service"

const repository = new TypeOrmEmployeeRepository()
export const employeeService = new EmployeeService(repository)
