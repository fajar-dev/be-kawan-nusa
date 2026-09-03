import { EntityManager } from "typeorm"
import { IUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { IReportDownloadHistoryRepository } from "./interfaces/report-download-history.repository.interface"
import { ReportType, ReportFormat, ReportDateBasis } from "./report.enum"
import { Redemption } from "../redemption/entities/redemption.entity"
import { RedemptionType, RedemptionStatus } from "../redemption/redemption.enum"
import { RedemptionStatusHistory } from "../redemption/entities/redemption-status-history.entity"
import { PointSubmission } from "../point-submission/entities/point-submission.entity"
import { PointSubmissionStatus } from "../point-submission/point-submission.enum"
import { Point } from "../point/entities/point.entity"
import { User } from "../user/entities/user.entity"
import { CustomerServiceReferral } from "../customer-service/entities/customer-service-referral.entity"
import { RateCommission } from "../rate-commission/entities/rate-commission.entity"
import { calculateWithdrawal } from "../../core/helpers/withdraw"
import { buildXlsxReportBuffer, buildCsvReportBuffer, maskTail, ReportBuildInput } from "../../core/helpers/report-file"
import { BadRequestException } from "../../core/exceptions/base"

const POINT_TO_RUPIAH = 1000

export interface ReportFilters {
    dateFrom?: string
    dateTo?: string
    snapshotDate?: string
    basis?: ReportDateBasis
    branchCode?: string
    serviceCode?: string
    statuses?: string[]
    format: ReportFormat
    includeSummary: boolean
    maskSensitive: boolean
}

interface UserBranchInfo {
    branchCode: string | null
    branchName: string | null
    lastReferralAt: Date | null
    referredServiceCodes: Set<string>
}

const formatDateID = (date: Date | string | null | undefined): string => {
    if (!date) return "-"
    const d = typeof date === "string" ? new Date(date) : date
    if (Number.isNaN(d.getTime())) return "-"
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

const startOfDay = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`)
const endOfDay = (dateStr: string): Date => new Date(`${dateStr}T23:59:59`)

export class ReportService {
    constructor(
        private readonly historyRepository: IReportDownloadHistoryRepository,
        private readonly unitOfWork: IUnitOfWork
    ) {}

    /**
     * Resolves, for a batch of userIds, the branch of each user's most recent
     * referred customer-service — this app has no direct User->Branch relation,
     * so a referral user's "cabang" for reporting purposes is derived this way.
     */
    private async getUserBranchInfo(manager: EntityManager, userIds: number[]): Promise<Map<number, UserBranchInfo>> {
        const result = new Map<number, UserBranchInfo>()
        if (userIds.length === 0) return result

        const referrals = await manager.getRepository(CustomerServiceReferral)
            .createQueryBuilder("referral")
            .innerJoinAndSelect("referral.customerService", "cs")
            .innerJoinAndSelect("cs.customer", "customer")
            .innerJoinAndSelect("cs.service", "service")
            .leftJoinAndSelect("customer.branch", "branch")
            .where("referral.userId IN (:...userIds)", { userIds })
            .orderBy("referral.createdAt", "DESC")
            .getMany()

        for (const referral of referrals) {
            const existing = result.get(referral.userId)
            const serviceCode = referral.customerService.serviceCode
            if (!existing) {
                result.set(referral.userId, {
                    branchCode: referral.customerService.customer.branchCode ?? null,
                    branchName: referral.customerService.customer.branch?.name ?? null,
                    lastReferralAt: referral.createdAt,
                    referredServiceCodes: new Set([serviceCode]),
                })
            } else {
                existing.referredServiceCodes.add(serviceCode)
            }
        }

        for (const userId of userIds) {
            if (!result.has(userId)) {
                result.set(userId, { branchCode: null, branchName: null, lastReferralAt: null, referredServiceCodes: new Set() })
            }
        }

        return result
    }

    /** Employee who most recently transitioned a redemption to `completed`, per redemption id. */
    private async getVerifierMap(manager: EntityManager, redemptionIds: number[]): Promise<Map<number, string>> {
        const result = new Map<number, string>()
        if (redemptionIds.length === 0) return result

        const histories = await manager.getRepository(RedemptionStatusHistory)
            .createQueryBuilder("history")
            .innerJoinAndSelect("history.changedBy", "employee")
            .where("history.redemptionId IN (:...ids)", { ids: redemptionIds })
            .andWhere("history.toStatus = :status", { status: RedemptionStatus.COMPLETED })
            .orderBy("history.createdAt", "DESC")
            .getMany()

        for (const history of histories) {
            if (!result.has(history.redemptionId)) {
                result.set(history.redemptionId, history.changedBy.name)
            }
        }
        return result
    }

    async generateCashRedemptionReport(filters: ReportFilters) {
        const manager = this.unitOfWork.getManager()
        const basis = filters.basis ?? ReportDateBasis.SUBMISSION
        const dateColumn = basis === ReportDateBasis.COMPLETION ? "redemption.updatedAt" : "redemption.createdAt"

        const query = manager.getRepository(Redemption).createQueryBuilder("redemption")
            .innerJoinAndSelect("redemption.user", "user")
            .leftJoinAndSelect("redemption.redemptionWithdraw", "withdraw")
            .where("redemption.type = :type", { type: RedemptionType.CASH })
            .andWhere("redemption.status IN (:...statuses)", { statuses: [RedemptionStatus.PENDING, RedemptionStatus.PROCESSING, RedemptionStatus.COMPLETED] })

        if (filters.dateFrom) query.andWhere(`${dateColumn} >= :dateFrom`, { dateFrom: startOfDay(filters.dateFrom) })
        if (filters.dateTo) query.andWhere(`${dateColumn} <= :dateTo`, { dateTo: endOfDay(filters.dateTo) })

        if (filters.statuses?.length) {
            const wantsBelum = filters.statuses.includes("belum_transfer")
            const wantsSudah = filters.statuses.includes("sudah_transfer")
            if (wantsBelum && !wantsSudah) {
                query.andWhere("redemption.status IN (:...s)", { s: [RedemptionStatus.PENDING, RedemptionStatus.PROCESSING] })
            } else if (wantsSudah && !wantsBelum) {
                query.andWhere("redemption.status = :s", { s: RedemptionStatus.COMPLETED })
            }
        }

        query.orderBy(dateColumn, "ASC")
        const redemptions = await query.getMany()

        const userIds = [...new Set(redemptions.map(r => r.userId))]
        const branchInfo = await this.getUserBranchInfo(manager, userIds)
        const verifierMap = await this.getVerifierMap(manager, redemptions.map(r => r.id))

        let rows = redemptions.map(r => {
            const info = branchInfo.get(r.userId)
            const { tax } = calculateWithdrawal(r.pointsUsed)
            const grossPayout = r.pointsUsed * POINT_TO_RUPIAH
            return {
                _branchCode: info?.branchCode ?? null,
                noTransaksi: r.redempNo ?? `RED-${r.id}`,
                tanggalPengajuan: formatDateID(r.createdAt),
                tanggalTransfer: r.status === RedemptionStatus.COMPLETED ? formatDateID(r.updatedAt) : "-",
                namaReferral: `${r.user.firstName} ${r.user.lastName ?? ""}`.trim(),
                email: r.user.email ?? "-",
                noIdentitas: r.user.identityNumber ? String(r.user.identityNumber) : "-",
                npwp: r.user.taxNumber ?? "-",
                cabang: info?.branchName ?? "Tanpa Cabang",
                poinDitukar: r.pointsUsed,
                nominalBruto: grossPayout,
                tarifPph: 0.025,
                nilaiPajak: tax,
                nominalNetto: grossPayout - tax,
                bank: r.redemptionWithdraw?.bankName ?? "-",
                noRekening: filters.maskSensitive ? maskTail(r.redemptionWithdraw?.accountNumber) : (r.redemptionWithdraw?.accountNumber ?? "-"),
                namaPemilikRekening: r.redemptionWithdraw?.accountHolderName ?? "-",
                statusTransfer: r.status === RedemptionStatus.COMPLETED ? "Sudah di Transfer" : "Belum di Transfer",
                diverifikasiOleh: verifierMap.get(r.id) ?? "-",
            }
        })

        if (filters.serviceCode) {
            const allowedUserIds = new Set(
                [...branchInfo.entries()]
                    .filter(([, info]) => info.referredServiceCodes.has(filters.serviceCode!))
                    .map(([userId]) => userId)
            )
            rows = rows.filter((_, idx) => allowedUserIds.has(redemptions[idx]!.userId))
        }

        if (filters.branchCode) {
            rows = rows.filter(row => row._branchCode === filters.branchCode)
        }

        const columns = [
            { header: "No. Transaksi", key: "noTransaksi", width: 20 },
            { header: "Tanggal Pengajuan", key: "tanggalPengajuan", width: 18 },
            { header: "Tanggal Transfer", key: "tanggalTransfer", width: 18 },
            { header: "Nama Referral", key: "namaReferral", width: 24 },
            { header: "Email", key: "email", width: 24 },
            { header: "No. Identitas", key: "noIdentitas", width: 20 },
            { header: "NPWP", key: "npwp", width: 20 },
            { header: "Cabang", key: "cabang", width: 16 },
            { header: "Poin Ditukar", key: "poinDitukar", width: 14 },
            { header: "Nominal Bruto", key: "nominalBruto", width: 16 },
            { header: "Tarif PPh", key: "tarifPph", width: 12 },
            { header: "Nilai Pajak", key: "nilaiPajak", width: 14 },
            { header: "Nominal Netto", key: "nominalNetto", width: 16 },
            { header: "Bank", key: "bank", width: 12 },
            { header: "No. Rekening", key: "noRekening", width: 20 },
            { header: "Nama Pemilik Rekening", key: "namaPemilikRekening", width: 24 },
            { header: "Status Transfer", key: "statusTransfer", width: 18 },
            { header: "Diverifikasi Oleh", key: "diverifikasiOleh", width: 20 },
        ]

        return {
            title: "Rekap Tukar Poin Tunai",
            columns,
            rows: rows.map(({ _branchCode, ...rest }) => rest),
            groupKey: "cabang",
            sumKeys: ["poinDitukar", "nominalBruto", "nilaiPajak", "nominalNetto"],
        }
    }

    async generateProductVoucherReport(filters: ReportFilters) {
        const manager = this.unitOfWork.getManager()
        const basis = filters.basis ?? ReportDateBasis.SUBMISSION
        const dateColumn = basis === ReportDateBasis.COMPLETION ? "redemption.updatedAt" : "redemption.createdAt"

        const query = manager.getRepository(Redemption).createQueryBuilder("redemption")
            .innerJoinAndSelect("redemption.user", "user")
            .leftJoinAndSelect("redemption.redemptionProduct", "product")
            .leftJoinAndSelect("product.catalog", "productCatalog")
            .leftJoinAndSelect("productCatalog.category", "productCategory")
            .leftJoinAndSelect("product.shipping", "shipping")
            .leftJoinAndSelect("redemption.redemptionVoucher", "voucher")
            .leftJoinAndSelect("voucher.catalog", "voucherCatalog")
            .leftJoinAndSelect("voucherCatalog.category", "voucherCategory")
            .leftJoinAndSelect("voucher.detail", "voucherDetail")
            .where("redemption.type IN (:...types)", { types: [RedemptionType.PRODUCT, RedemptionType.VOUCHER] })
            .andWhere("redemption.status IN (:...statuses)", { statuses: [RedemptionStatus.PENDING, RedemptionStatus.PROCESSING, RedemptionStatus.COMPLETED] })

        if (filters.dateFrom) query.andWhere(`${dateColumn} >= :dateFrom`, { dateFrom: startOfDay(filters.dateFrom) })
        if (filters.dateTo) query.andWhere(`${dateColumn} <= :dateTo`, { dateTo: endOfDay(filters.dateTo) })

        const statusMap: Record<string, RedemptionStatus> = {
            pending: RedemptionStatus.PENDING,
            diproses: RedemptionStatus.PROCESSING,
            selesai: RedemptionStatus.COMPLETED,
        }
        if (filters.statuses?.length) {
            const mapped = filters.statuses.map(s => statusMap[s]).filter(Boolean) as RedemptionStatus[]
            if (mapped.length) query.andWhere("redemption.status IN (:...ms)", { ms: mapped })
        }

        query.orderBy(dateColumn, "ASC")
        const redemptions = await query.getMany()

        const userIds = [...new Set(redemptions.map(r => r.userId))]
        const branchInfo = await this.getUserBranchInfo(manager, userIds)

        const statusLabel: Record<RedemptionStatus, string> = {
            [RedemptionStatus.PENDING]: "Pending",
            [RedemptionStatus.PROCESSING]: "Diproses",
            [RedemptionStatus.COMPLETED]: "Selesai",
            [RedemptionStatus.CANCELLED]: "Dibatalkan",
            [RedemptionStatus.EXPIRED]: "Kedaluwarsa",
        }

        let rows = redemptions.map(r => {
            const info = branchInfo.get(r.userId)
            const isProduct = r.type === RedemptionType.PRODUCT
            const catalog = isProduct ? r.redemptionProduct?.catalog : r.redemptionVoucher?.catalog
            const recipientName = isProduct ? r.redemptionProduct?.name : r.redemptionVoucher?.name
            const recipientContact = isProduct
                ? [r.redemptionProduct?.address].filter(Boolean).join(", ") || r.redemptionProduct?.email || "-"
                : r.redemptionVoucher?.email ?? "-"

            return {
                _branchCode: info?.branchCode ?? null,
                noTransaksi: r.redempNo ?? `RED-${r.id}`,
                tanggalPengajuan: formatDateID(r.createdAt),
                tanggalSelesai: r.status === RedemptionStatus.COMPLETED ? formatDateID(r.updatedAt) : "-",
                namaReferral: `${r.user.firstName} ${r.user.lastName ?? ""}`.trim(),
                email: r.user.email ?? "-",
                cabang: info?.branchName ?? "Tanpa Cabang",
                tipeReward: isProduct ? "Produk" : "Voucher",
                namaItem: catalog?.name ?? "-",
                kategori: catalog?.category?.name ?? "-",
                poinDitukar: r.pointsUsed,
                nilaiPoin: r.pointsUsed * POINT_TO_RUPIAH,
                penerima: recipientName ?? "-",
                alamatEmailPenerima: recipientContact,
                kurir: r.redemptionProduct?.shipping?.shipper ?? "-",
                noResi: r.redemptionProduct?.shipping?.trackingNumber ?? "-",
                kodeVoucher: r.redemptionVoucher?.detail?.code ?? "-",
                masaBerlakuVoucher: r.redemptionVoucher?.detail?.expiredDate ? formatDateID(r.redemptionVoucher.detail.expiredDate) : "-",
                status: statusLabel[r.status],
            }
        })

        if (filters.serviceCode) {
            const allowedUserIds = new Set(
                [...branchInfo.entries()]
                    .filter(([, info]) => info.referredServiceCodes.has(filters.serviceCode!))
                    .map(([userId]) => userId)
            )
            rows = rows.filter((_, idx) => allowedUserIds.has(redemptions[idx]!.userId))
        }

        if (filters.branchCode) {
            rows = rows.filter(row => row._branchCode === filters.branchCode)
        }

        const columns = [
            { header: "No. Transaksi", key: "noTransaksi", width: 20 },
            { header: "Tanggal Pengajuan", key: "tanggalPengajuan", width: 18 },
            { header: "Tanggal Selesai", key: "tanggalSelesai", width: 18 },
            { header: "Nama Referral", key: "namaReferral", width: 24 },
            { header: "Email", key: "email", width: 24 },
            { header: "Cabang", key: "cabang", width: 16 },
            { header: "Tipe Reward", key: "tipeReward", width: 12 },
            { header: "Nama Item", key: "namaItem", width: 24 },
            { header: "Kategori", key: "kategori", width: 16 },
            { header: "Poin Ditukar", key: "poinDitukar", width: 14 },
            { header: "Nilai Poin (Rp)", key: "nilaiPoin", width: 16 },
            { header: "Penerima", key: "penerima", width: 24 },
            { header: "Alamat / Email Penerima", key: "alamatEmailPenerima", width: 30 },
            { header: "Kurir", key: "kurir", width: 12 },
            { header: "No. Resi", key: "noResi", width: 20 },
            { header: "Kode Voucher", key: "kodeVoucher", width: 16 },
            { header: "Masa Berlaku Voucher", key: "masaBerlakuVoucher", width: 20 },
            { header: "Status", key: "status", width: 14 },
        ]

        return {
            title: "Rekap Tukar Poin Produk & Voucher",
            columns,
            rows: rows.map(({ _branchCode, ...rest }) => rest),
            groupKey: "cabang",
            sumKeys: ["poinDitukar", "nilaiPoin"],
        }
    }

    async generateReferralPointReport(filters: ReportFilters) {
        const manager = this.unitOfWork.getManager()
        const basis = filters.basis ?? ReportDateBasis.SUBMISSION
        const dateColumn = basis === ReportDateBasis.COMPLETION ? "submission.approvedAt" : "submission.createdAt"

        const query = manager.getRepository(PointSubmission).createQueryBuilder("submission")
            .innerJoinAndSelect("submission.user", "user")

        if (filters.dateFrom) query.andWhere(`${dateColumn} >= :dateFrom`, { dateFrom: startOfDay(filters.dateFrom) })
        if (filters.dateTo) query.andWhere(`${dateColumn} <= :dateTo`, { dateTo: endOfDay(filters.dateTo) })

        const statusMap: Record<string, PointSubmissionStatus> = {
            belum_disetujui: PointSubmissionStatus.PENDING,
            sudah_disetujui: PointSubmissionStatus.APPROVED,
            ditolak: PointSubmissionStatus.REJECTED,
        }
        if (filters.statuses?.length) {
            const mapped = filters.statuses.map(s => statusMap[s]).filter(Boolean) as PointSubmissionStatus[]
            if (mapped.length) query.andWhere("submission.status IN (:...ms)", { ms: mapped })
        }
        if (filters.serviceCode) query.andWhere("JSON_EXTRACT(submission.nisData, '$.serviceCode') = :serviceCode", { serviceCode: filters.serviceCode })

        query.orderBy(dateColumn, "ASC")
        const submissions = await query.getMany()

        const custIds = [...new Set(submissions.map(s => s.nisData.custId))]
        const customerBranches = custIds.length > 0
            ? await manager.query(
                `SELECT c.id as custId, c.branch_code as branchCode, b.name as branchName
                 FROM customers c LEFT JOIN branches b ON b.code = c.branch_code
                 WHERE c.id IN (${custIds.map(() => "?").join(",")})`,
                custIds
            )
            : []
        const branchByCustId = new Map<string, { branchCode: string | null; branchName: string | null }>(
            customerBranches.map((c: any) => [c.custId, { branchCode: c.branchCode, branchName: c.branchName }])
        )

        const rateCommissions = await manager.getRepository(RateCommission).find()

        const statusLabel: Record<PointSubmissionStatus, string> = {
            [PointSubmissionStatus.PENDING]: "Belum Disetujui",
            [PointSubmissionStatus.APPROVED]: "Sudah Disetujui",
            [PointSubmissionStatus.REJECTED]: "Ditolak",
        }

        let rows = submissions.map(s => {
            const branch = branchByCustId.get(s.nisData.custId)
            const activeRate = rateCommissions.find(rc =>
                rc.serviceCode === s.nisData.serviceCode &&
                rc.category === s.type &&
                new Date(rc.startDate) <= s.createdAt &&
                (!rc.endDate || new Date(rc.endDate) >= s.createdAt)
            )

            return {
                _branchCode: branch?.branchCode ?? null,
                tanggalTransaksi: formatDateID(s.createdAt),
                tanggalDisetujui: s.approvedAt ? formatDateID(s.approvedAt) : "-",
                noReferensi: `REF-${s.createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${String(s.id).padStart(4, "0")}`,
                namaReferral: `${s.user.firstName} ${s.user.lastName ?? ""}`.trim(),
                customerId: s.nisData.custId,
                namaCustomer: s.nisData.accountName,
                cabang: branch?.branchName ?? "Tanpa Cabang",
                namaLayanan: s.nisData.serviceName,
                tipeKomisi: activeRate ? (activeRate.type === "flat" ? "Nominal Tetap" : "Persentase") : "-",
                nilaiPembayaran: Number(s.price),
                rateKomisi: activeRate ? Number(activeRate.value) : null,
                nilaiKomisi: Number(s.point) * POINT_TO_RUPIAH,
                poinTerbit: Number(s.point),
                tipePoin: s.type,
                accountManager: s.nisData.accountManager ?? "-",
                statusPersetujuan: statusLabel[s.status],
            }
        })

        if (filters.branchCode) {
            rows = rows.filter(row => row._branchCode === filters.branchCode)
        }

        const columns = [
            { header: "Tanggal Transaksi", key: "tanggalTransaksi", width: 18 },
            { header: "Tanggal Disetujui", key: "tanggalDisetujui", width: 18 },
            { header: "No. Referensi", key: "noReferensi", width: 20 },
            { header: "Nama Referral", key: "namaReferral", width: 24 },
            { header: "Customer ID", key: "customerId", width: 16 },
            { header: "Nama Customer", key: "namaCustomer", width: 24 },
            { header: "Cabang", key: "cabang", width: 16 },
            { header: "Nama Layanan", key: "namaLayanan", width: 20 },
            { header: "Tipe Komisi", key: "tipeKomisi", width: 14 },
            { header: "Nilai Pembayaran", key: "nilaiPembayaran", width: 18 },
            { header: "Rate Komisi", key: "rateKomisi", width: 14 },
            { header: "Nilai Komisi (Rp)", key: "nilaiKomisi", width: 18 },
            { header: "Poin Terbit", key: "poinTerbit", width: 14 },
            { header: "Tipe Poin", key: "tipePoin", width: 12 },
            { header: "Account Manager", key: "accountManager", width: 20 },
            { header: "Status Persetujuan", key: "statusPersetujuan", width: 18 },
        ]

        return {
            title: "Rekap Poin Referral",
            columns,
            rows: rows.map(({ _branchCode, ...rest }) => rest),
            groupKey: "cabang",
            sumKeys: ["nilaiPembayaran", "nilaiKomisi", "poinTerbit"],
        }
    }

    async generatePointBalanceReport(filters: ReportFilters) {
        const manager = this.unitOfWork.getManager()
        const snapshotDate = filters.snapshotDate ? new Date(`${filters.snapshotDate}T23:59:59`) : new Date()
        const monthStart = new Date(snapshotDate.getFullYear(), snapshotDate.getMonth(), 1)
        const beforeMonthStart = new Date(monthStart.getTime() - 1000)

        const userQuery = manager.getRepository(User).createQueryBuilder("user")
            .where("user.status = :status", { status: "active" })
        if (filters.statuses?.length) {
            const wantsActive = filters.statuses.includes("aktif")
            const wantsInactive = filters.statuses.includes("nonaktif")
            if (wantsInactive && !wantsActive) userQuery.where("user.status = :status", { status: "inactive" })
            else if (wantsActive && wantsInactive) userQuery.where("user.status IN (:...s)", { s: ["active", "inactive"] })
        }
        const users = await userQuery.getMany()
        const userIds = users.map(u => u.id)

        const branchInfo = await this.getUserBranchInfo(manager, userIds)

        const pointRepo = manager.getRepository(Point)
        const issuedUpTo = async (cutoff: Date) => {
            const raw = await pointRepo.createQueryBuilder("point")
                .select("point.userId", "userId")
                .addSelect("SUM(point.point)", "total")
                .where("point.userId IN (:...userIds)", { userIds })
                .andWhere("point.createdAt <= :cutoff", { cutoff })
                .groupBy("point.userId")
                .getRawMany()
            return new Map<number, number>(raw.map((r: any) => [Number(r.userId), Number(r.total) || 0]))
        }

        const redemptionRepo = manager.getRepository(Redemption)
        const usedUpTo = async (cutoff: Date) => {
            const raw = await redemptionRepo.createQueryBuilder("redemption")
                .select("redemption.userId", "userId")
                .addSelect("SUM(redemption.pointsUsed)", "total")
                .where("redemption.userId IN (:...userIds)", { userIds })
                .andWhere("redemption.status IN (:...statuses)", { statuses: [RedemptionStatus.PENDING, RedemptionStatus.PROCESSING, RedemptionStatus.COMPLETED] })
                .andWhere("redemption.createdAt <= :cutoff", { cutoff })
                .groupBy("redemption.userId")
                .getRawMany()
            return new Map<number, number>(raw.map((r: any) => [Number(r.userId), Number(r.total) || 0]))
        }

        const [issuedBefore, issuedNow, usedBefore, usedNow] = await Promise.all([
            issuedUpTo(beforeMonthStart),
            issuedUpTo(snapshotDate),
            usedUpTo(beforeMonthStart),
            usedUpTo(snapshotDate),
        ])

        const lastReferralQuery = userIds.length > 0
            ? await manager.getRepository(CustomerServiceReferral)
                .createQueryBuilder("referral")
                .where("referral.userId IN (:...userIds)", { userIds })
                .getMany()
            : []

        let rows = users.map(u => {
            const info = branchInfo.get(u.id)
            const saldoAwal = (issuedBefore.get(u.id) ?? 0) - (usedBefore.get(u.id) ?? 0)
            const saldoAkhir = (issuedNow.get(u.id) ?? 0) - (usedNow.get(u.id) ?? 0)
            const masuk = (issuedNow.get(u.id) ?? 0) - (issuedBefore.get(u.id) ?? 0)
            const terpakai = (usedNow.get(u.id) ?? 0) - (usedBefore.get(u.id) ?? 0)

            return {
                _branchCode: info?.branchCode ?? null,
                namaReferral: `${u.firstName} ${u.lastName ?? ""}`.trim(),
                email: u.email ?? "-",
                noTelpon: u.phone ?? "-",
                noIdentitas: u.identityNumber ? String(u.identityNumber) : "-",
                npwp: u.taxNumber ?? "-",
                cabang: info?.branchName ?? "Tanpa Cabang",
                bank: u.bankName ?? "-",
                noRekening: filters.maskSensitive ? maskTail(u.accountNumber) : (u.accountNumber ?? "-"),
                statusAkun: u.status === "active" ? "Aktif" : "Nonaktif",
                tanggalRegistrasi: formatDateID(u.createdAt),
                referensiTerakhir: info?.lastReferralAt ? formatDateID(info.lastReferralAt) : "-",
                saldoPoinAwal: saldoAwal,
                poinMasuk: masuk,
                poinTerpakai: terpakai,
                saldoPoinAkhir: saldoAkhir,
                nilaiSaldo: saldoAkhir * POINT_TO_RUPIAH,
            }
        })

        if (filters.serviceCode) {
            const allowedUserIds = new Set(
                [...branchInfo.entries()]
                    .filter(([, info]) => info.referredServiceCodes.has(filters.serviceCode!))
                    .map(([userId]) => userId)
            )
            rows = rows.filter((_, idx) => allowedUserIds.has(users[idx]!.id))
        }
        if (filters.branchCode) {
            rows = rows.filter(row => row._branchCode === filters.branchCode)
        }

        const columns = [
            { header: "Nama Referral", key: "namaReferral", width: 24 },
            { header: "Email", key: "email", width: 24 },
            { header: "No. Telpon", key: "noTelpon", width: 16 },
            { header: "No. Identitas", key: "noIdentitas", width: 20 },
            { header: "NPWP", key: "npwp", width: 20 },
            { header: "Cabang", key: "cabang", width: 16 },
            { header: "Bank", key: "bank", width: 12 },
            { header: "No. Rekening", key: "noRekening", width: 20 },
            { header: "Status Akun", key: "statusAkun", width: 12 },
            { header: "Tanggal Registrasi", key: "tanggalRegistrasi", width: 18 },
            { header: "Referensi Terakhir", key: "referensiTerakhir", width: 18 },
            { header: "Saldo Poin Awal", key: "saldoPoinAwal", width: 16 },
            { header: "Poin Masuk (periode)", key: "poinMasuk", width: 18 },
            { header: "Poin Terpakai (periode)", key: "poinTerpakai", width: 20 },
            { header: "Saldo Poin Akhir", key: "saldoPoinAkhir", width: 16 },
            { header: "Nilai Saldo (Rp)", key: "nilaiSaldo", width: 18 },
        ]

        return {
            title: "Saldo Poin & Data Referral",
            columns,
            rows: rows.map(({ _branchCode, ...rest }) => rest),
            groupKey: "cabang",
            sumKeys: ["saldoPoinAwal", "poinMasuk", "poinTerpakai", "saldoPoinAkhir", "nilaiSaldo"],
        }
    }

    private buildMeta(type: ReportType, filters: ReportFilters, branchLabel: string, serviceLabel: string): { meta: { label: string; value: string }[]; periodLabel: string } {
        const meta: { label: string; value: string }[] = []
        let periodLabel = "-"

        if (type === ReportType.POINT_BALANCE) {
            periodLabel = filters.snapshotDate ? formatDateID(filters.snapshotDate) : formatDateID(new Date())
            meta.push({ label: "Posisi Saldo Per Tanggal", value: periodLabel })
        } else {
            periodLabel = filters.dateFrom && filters.dateTo
                ? `${formatDateID(filters.dateFrom)} – ${formatDateID(filters.dateTo)}`
                : "Semua Periode"
            meta.push({ label: "Periode", value: periodLabel })
            meta.push({ label: "Basis Tanggal", value: filters.basis === ReportDateBasis.COMPLETION ? "Tanggal Penyelesaian" : "Tanggal Pengajuan" })
        }

        meta.push({ label: "Filter — Cabang", value: branchLabel })
        meta.push({ label: "Filter — Nama Layanan", value: serviceLabel })
        meta.push({ label: "Format Berkas", value: filters.format === ReportFormat.XLSX ? "XLSX (.xlsx)" : "CSV (.csv)" })
        meta.push({ label: "Opsi", value: `Sertakan baris ringkasan: ${filters.includeSummary ? "Ya" : "Tidak"} · Samarkan rekening & NPWP: ${filters.maskSensitive ? "Ya" : "Tidak"}` })
        meta.push({ label: "Kurs Poin", value: String(POINT_TO_RUPIAH) })

        return { meta, periodLabel }
    }

    async generateReportFile(type: ReportType, filters: ReportFilters, branchLabel: string, serviceLabel: string): Promise<{ buffer: Buffer; filename: string; contentType: string; periodLabel: string }> {
        let result: { title: string; columns: any[]; rows: Record<string, unknown>[]; groupKey: string; sumKeys: string[] }

        switch (type) {
            case ReportType.CASH_REDEMPTION:
                result = await this.generateCashRedemptionReport(filters)
                break
            case ReportType.PRODUCT_VOUCHER_REDEMPTION:
                result = await this.generateProductVoucherReport(filters)
                break
            case ReportType.REFERRAL_POINT:
                result = await this.generateReferralPointReport(filters)
                break
            case ReportType.POINT_BALANCE:
                result = await this.generatePointBalanceReport(filters)
                break
            default:
                throw new BadRequestException("Jenis laporan tidak dikenali")
        }

        const { meta, periodLabel } = this.buildMeta(type, filters, branchLabel, serviceLabel)

        const buildInput: ReportBuildInput = {
            title: result.title,
            meta,
            columns: result.columns,
            rows: result.rows,
            groupKey: result.groupKey,
            sumKeys: result.sumKeys,
            includeSummary: filters.includeSummary,
        }

        const slug = result.title.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "")
        const dateSuffix = type === ReportType.POINT_BALANCE
            ? `per-${filters.snapshotDate ?? new Date().toISOString().slice(0, 10)}`
            : (filters.dateFrom ? filters.dateFrom.slice(0, 7) : new Date().toISOString().slice(0, 7))

        if (filters.format === ReportFormat.CSV) {
            const buffer = buildCsvReportBuffer(buildInput)
            return { buffer, filename: `${slug}_${dateSuffix}.csv`, contentType: "text/csv; charset=utf-8", periodLabel }
        }

        const buffer = await buildXlsxReportBuffer(buildInput)
        return { buffer, filename: `${slug}_${dateSuffix}.xlsx`, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", periodLabel }
    }

    async logDownload(type: ReportType, format: ReportFormat, periodLabel: string, filters: Record<string, unknown>, requestedById: number) {
        return this.historyRepository.create({ type, format, periodLabel, filters, requestedById })
    }

    async getDownloadHistories(page: number, limit: number, q?: string) {
        return this.historyRepository.findAll(page, limit, q)
    }
}
