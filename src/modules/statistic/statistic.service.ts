import { AppDataSource } from "../../config/database"
import { Customer } from "../customer/entities/customer.entity"
import { CustomerService } from "../customer-service/entities/customer-service.entity"
import { Point } from "../point/entities/point.entity"
import { Repository } from "typeorm"

export class StatisticService {
    private customerRepository: Repository<Customer>
    private customerServiceRepository: Repository<CustomerService>
    private pointRepository: Repository<Point>

    constructor() {
        this.customerRepository = AppDataSource.getRepository(Customer)
        this.customerServiceRepository = AppDataSource.getRepository(CustomerService)
        this.pointRepository = AppDataSource.getRepository(Point)
    }

    async getCount(userId: number) {
        const [customer, customerService, point] = await Promise.all([
            this.customerRepository.count({ where: { userId } }),
            this.customerServiceRepository.count({
                where: {
                    customer: { userId }
                },
                relations: ["customer"]
            }),
            this.pointRepository.findOne({ where: { userId } })
        ])

        return {
            customer,
            customerService,
            point: point?.value ?? 0
        }
    }
}
