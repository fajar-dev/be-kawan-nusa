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
                userId
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

    async getAll(userId: number, page: number, limit: number, q: string, sort: string, order: string, filters: { startDate?: string, endDate?: string, isActive?: string } = {}) {
        const skip = (page - 1) * limit
        const { startDate, endDate, isActive } = filters
        
        const query = this.repository.createQueryBuilder("service")
            .leftJoin("customer_services", "cs", "cs.service_code = service.code AND cs.user_id = :userId", { userId })
            .leftJoin("rewards", "r", "r.customer_service_id = cs.id")
            .select("service")
            .addSelect("COUNT(DISTINCT cs.id)", "totalCustomerServices")
            .addSelect("MAX(cs.reference_date)", "lastReferanceDate")
            .addSelect("SUM(r.point)", "totalPoint")
            .groupBy("service.id")

        if (q) {
            query.andWhere(new Brackets(qb => {
                qb.where("service.code LIKE :q")
                  .orWhere("service.name LIKE :q")
                  .orWhere("service.description LIKE :q")
            }), { q: `%${q}%` })
        }

        if (startDate) {
            query.andHaving("MAX(cs.reference_date) >= :startDate", { startDate })
        }
        if (endDate) {
            query.andHaving("MAX(cs.reference_date) <= :endDate", { endDate })
        }
        if (isActive) {
            query.andWhere("service.isActive = :isActive", { isActive })
        }

        if (sort === "totalCustomerServices" || sort === "lastReferanceDate" || sort === "totalPoint") {
            query.orderBy(sort, order.toUpperCase() as any)
        } else {
            query.orderBy(`service.${sort}`, order.toUpperCase() as any)
        }

        const rawAll = await query.getRawMany()
        const total = rawAll.length

        const { entities, raw } = await query
            .offset(skip)
            .limit(limit)
            .getRawAndEntities()

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
