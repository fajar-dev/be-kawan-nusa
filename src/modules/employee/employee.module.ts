import { EmployeeRepository } from "./repositories/employee.repository"
import { EmployeeService } from "./employee.service"

const repository = new EmployeeRepository()
export const employeeService = new EmployeeService(repository)
