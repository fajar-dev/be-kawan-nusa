import { IRoleRepository } from "./interfaces/role.repository.interface"
import { AppDataSource } from "../../config/database"
import { Employee } from "../employee/entities/employee.entity"
import { NotFoundException, BadRequestException } from "../../core/exceptions/base"
import { In } from "typeorm"

export const PERMISSION_MODULES = [
    { key: 'dashboard', label: 'Dashboard Overview', group: 'Beranda', actions: ['L'] },
    { key: 'user', label: 'Daftar Referral', group: 'Referral', actions: ['L', 'T', 'E', 'H'] },
    { key: 'user.approval', label: 'Persetujuan Pendaftaran', group: 'Referral', actions: ['L', 'T', 'E', 'H'] },
    { key: 'point-submission', label: 'Input Poin', group: 'Input Poin Referral', actions: ['L', 'T', 'E', 'H'] },
    { key: 'point-submission.history', label: 'Riwayat Poin', group: 'Input Poin Referral', actions: ['L', 'T', 'E', 'H'] },
    { key: 'point-submission.request', label: 'Permintaan Penukaran', group: 'Input Poin Referral', actions: ['L', 'T', 'E'] },
    { key: 'redemption.cash', label: 'Tunai', group: 'Tukar Poin', actions: ['L', 'T', 'E', 'H'] },
    { key: 'redemption.product', label: 'Produk', group: 'Tukar Poin', actions: ['L', 'T', 'E', 'H'] },
    { key: 'redemption.voucher', label: 'Voucher', group: 'Tukar Poin', actions: ['L', 'T', 'E', 'H'] },
    { key: 'catalog', label: 'Katalog Reward', group: 'Katalog Reward', actions: ['L', 'T', 'E', 'H'] },
    { key: 'education', label: 'Konten Edukasi', group: 'Konten Edukasi', actions: ['L', 'T', 'E', 'H'] },
    { key: 'employee', label: 'Manajemen Karyawan', group: 'Manajemen Karyawan', actions: ['L', 'T', 'E', 'H'] },
    { key: 'role', label: 'Pengaturan Akses', group: 'Pengaturan Akses', actions: ['L', 'T', 'E', 'H'] },
]

export class RoleService {
    constructor(private readonly repository: IRoleRepository) {}

    async getAll(page: number, limit: number, q?: string) {
        const { data, total } = await this.repository.findAll(page, limit, q)

        const employeeRepo = AppDataSource.getRepository(Employee)
        const rolesWithCount = await Promise.all(
            data.map(async (role) => {
                const employeeCount = await employeeRepo.count({ where: { roleId: role.id } })
                return { role, employeeCount }
            })
        )

        return { data: rolesWithCount, total }
    }

    async getById(id: number) {
        const role = await this.repository.findById(id)
        if (!role) throw new NotFoundException("Role not found")

        const employeeRepo = AppDataSource.getRepository(Employee)
        const employees = await employeeRepo.find({
            where: { roleId: id },
            select: ["id", "name", "email", "photo"],
            order: { name: "ASC" },
        })

        return { ...role, employees, employeeCount: employees.length }
    }

    async create(data: { name: string; description?: string; color?: string; permissions: Record<string, string[]>; employeeIds?: number[] }) {
        const existing = await this.repository.findByName(data.name)
        if (existing) throw new BadRequestException("Role name already exists")

        const { employeeIds, ...roleData } = data
        const role = await this.repository.save(roleData)

        // Assign employees to this role
        if (employeeIds && employeeIds.length > 0) {
            await this.syncEmployees(role.id, employeeIds)
        }

        return role
    }

    async update(id: number, data: Partial<{ name: string; description?: string; color?: string; permissions: Record<string, string[]>; employeeIds?: number[] }>) {
        const role = await this.repository.findById(id)
        if (!role) throw new NotFoundException("Role not found")

        if (data.name && data.name !== role.name) {
            const existing = await this.repository.findByName(data.name)
            if (existing) throw new BadRequestException("Role name already exists")
        }

        const { employeeIds, ...roleData } = data

        const updated = await this.repository.save({ ...role, ...roleData })

        // Sync employees if employeeIds is provided
        if (employeeIds !== undefined) {
            await this.syncEmployees(id, employeeIds)
        }

        return updated
    }

    async delete(id: number) {
        const role = await this.repository.findById(id)
        if (!role) throw new NotFoundException("Role not found")

        // Unassign employees first, then delete
        const employeeRepo = AppDataSource.getRepository(Employee)
        await employeeRepo.update({ roleId: id }, { roleId: null as any })
        await this.repository.delete(id)
    }

    async getAllEmployees() {
        const employeeRepo = AppDataSource.getRepository(Employee)
        return await employeeRepo.find({
            select: ["id", "name", "email", "photo", "roleId"],
            where: { isActive: true },
            order: { name: "ASC" },
        })
    }

    getPermissionMatrix() {
        return PERMISSION_MODULES
    }

    private async syncEmployees(roleId: number, employeeIds: number[]) {
        const employeeRepo = AppDataSource.getRepository(Employee)

        // Remove this role from employees not in the list
        await employeeRepo
            .createQueryBuilder()
            .update(Employee)
            .set({ roleId: null } as any)
            .where("roleId = :roleId", { roleId })
            .andWhere("id NOT IN (:...employeeIds)", { employeeIds: employeeIds.length > 0 ? employeeIds : [0] })
            .execute()

        // Assign this role to selected employees
        if (employeeIds.length > 0) {
            await employeeRepo.update(
                { id: In(employeeIds) },
                { roleId }
            )
        }
    }
}
