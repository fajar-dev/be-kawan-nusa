import { AppDataSource } from "../../config/database"
import { Service } from "./entities/service.entity"
import { CustomerService as CustomerServiceEntity } from "../customer-service/entities/customer-service.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { In, Brackets, Repository } from "typeorm"

export class ServiceService {
    private repository: Repository<Service>
    private customerServiceRepo: Repository<CustomerServiceEntity>

    constructor() {
        this.repository = AppDataSource.getRepository(Service)
        this.customerServiceRepo = AppDataSource.getRepository(CustomerServiceEntity)
    }

    private async attachCustomerServiceData(services: Service[], userId: number) {
        if (!services.length) return

        const serviceCodes = services.map(s => s.code)
        const customerServices = await this.customerServiceRepo.find({
            where: {
                serviceCode: In(serviceCodes),
                customer: { userId }
            },
            relations: ["customer", "rewards"],
            order: { referenceDate: "DESC" }
        })

        services.forEach(service => {
            const relatedCs = customerServices.filter(cs => cs.serviceCode === service.code)
            ;(service as any).totalCustomerServices = relatedCs.length
            ;(service as any).lastReferanceDate = relatedCs[0]?.referenceDate ?? null
            ;(service as any).totalPoint = relatedCs.reduce((sum, cs) => {
                return sum + (cs.rewards?.reduce((rSum, r) => rSum + Number(r.point), 0) ?? 0)
            }, 0)
        })
    }

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string) {
        const skip = (page - 1) * limit
        
        const query = this.repository.createQueryBuilder("service")
            .leftJoin("customer_services", "cs", "cs.service_code = service.code")
            .leftJoin("customers", "c", "c.id = cs.customer_id AND c.user_id = :userId", { userId })
            .leftJoin("rewards", "r", "r.customer_service_id = cs.id")
            .select("service")
            .addSelect("COUNT(DISTINCT CASE WHEN c.user_id = :userId THEN cs.id ELSE NULL END)", "totalCustomerServices")
            .addSelect("MAX(CASE WHEN c.user_id = :userId THEN cs.reference_date ELSE NULL END)", "lastReferanceDate")
            .addSelect("SUM(CASE WHEN c.user_id = :userId THEN r.point ELSE 0 END)", "totalPoint")
            .groupBy("service.id")

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("service.code LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("service.description LIKE :q")
            }), { q: `%${q}%` })
        }

        if (sort === "totalCustomerServices" || sort === "lastReferanceDate" || sort === "totalPoint") {
            query.orderBy(sort, order.toUpperCase() as any)
        } else {
            query.orderBy(`service.${sort}`, order.toUpperCase() as any)
        }

        const { entities, raw } = await query
            .offset(skip)
            .limit(limit)
            .getRawAndEntities()

        const totalQuery = this.repository.createQueryBuilder("service")
        if (q) {
            totalQuery.where(new Brackets(qb => {
                qb.where("service.code LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("service.description LIKE :q")
            }), { q: `%${q}%` })
        }
        const total = await totalQuery.getCount()

        const data = entities.map(entity => {
            const rawData = raw.find(r => r.service_id === entity.id)
            return {
                ...entity,
                totalCustomerServices: Number(rawData?.totalCustomerServices || 0),
                lastReferanceDate: rawData?.lastReferanceDate || null,
                totalPoint: Number(rawData?.totalPoint || 0)
            }
        })

        return { data, total }
    }

    async getByCode(code: string, userId: number) {
        const service = await this.repository.findOneBy({ code })
        if (!service) {
            throw new NotFoundException("Service not found")
        }

        await this.attachCustomerServiceData([service], userId)
        return service
    }

    async getServices() {
        return await this.repository.find({
            order: { name: "ASC" }
        })
    }
}
