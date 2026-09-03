import { Context } from "hono"
import { ReportService, ReportFilters } from "./report.service"
import { BranchService } from "../branch/branch.service"
import { ServiceService } from "../service/service.service"
import { ApiResponse } from "../../core/helpers/response"
import { ReportDownloadHistorySerializer } from "./serializers/report-download-history.serialize"
import { ReportQueryValidator } from "./validators/report.validator"
import { ReportType, ReportFormat } from "./report.enum"

const PREVIEW_LIMIT = 20

export class ReportController {
    constructor(
        private readonly service: ReportService,
        private readonly branchService: BranchService,
        private readonly serviceService: ServiceService
    ) {}

    private parseQuery(c: Context): ReportQueryValidator {
        const queries = c.req.queries()
        const raw = {
            type: c.req.query("type"),
            format: c.req.query("format"),
            dateFrom: c.req.query("dateFrom"),
            dateTo: c.req.query("dateTo"),
            snapshotDate: c.req.query("snapshotDate"),
            basis: c.req.query("basis"),
            branchCode: c.req.query("branchCode"),
            serviceCode: c.req.query("serviceCode"),
            statuses: queries["statuses[]"] || queries["statuses"],
            includeSummary: c.req.query("includeSummary"),
            maskSensitive: c.req.query("maskSensitive"),
        }
        return ReportQueryValidator.parse(raw)
    }

    private async resolveLabels(branchCode?: string, serviceCode?: string): Promise<{ branchLabel: string; serviceLabel: string }> {
        let branchLabel = "Semua Cabang"
        let serviceLabel = "Semua Layanan"

        if (branchCode) {
            const branches = await this.branchService.getAll()
            branchLabel = branches.find(b => b.code === branchCode)?.name ?? branchCode
        }
        if (serviceCode) {
            const services = await this.serviceService.getServices()
            serviceLabel = services.find(s => s.code === serviceCode)?.name ?? serviceCode
        }

        return { branchLabel, serviceLabel }
    }

    async preview(c: Context) {
        const query = this.parseQuery(c)
        const filters: ReportFilters = { ...query }

        const result = await (() => {
            switch (query.type) {
                case ReportType.CASH_REDEMPTION: return this.service.generateCashRedemptionReport(filters)
                case ReportType.PRODUCT_VOUCHER_REDEMPTION: return this.service.generateProductVoucherReport(filters)
                case ReportType.REFERRAL_POINT: return this.service.generateReferralPointReport(filters)
                case ReportType.POINT_BALANCE: return this.service.generatePointBalanceReport(filters)
            }
        })()

        return ApiResponse.success(c, {
            columns: result.columns,
            rows: result.rows.slice(0, PREVIEW_LIMIT),
            totalRows: result.rows.length,
            truncated: result.rows.length > PREVIEW_LIMIT,
        }, "Report preview generated successfully")
    }

    async download(c: Context) {
        const admin = c.get("user")
        const query = this.parseQuery(c)
        const filters: ReportFilters = { ...query }

        const { branchLabel, serviceLabel } = await this.resolveLabels(query.branchCode, query.serviceCode)
        const file = await this.service.generateReportFile(query.type, filters, branchLabel, serviceLabel)

        await this.service.logDownload(query.type, query.format ?? ReportFormat.XLSX, file.periodLabel, { ...query }, admin.id)

        c.header("Content-Type", file.contentType)
        c.header("Content-Disposition", `attachment; filename="${file.filename}"`)
        return c.body(new Uint8Array(file.buffer))
    }

    async histories(c: Context) {
        const page = Number(c.req.query("page")) || 1
        const limit = Number(c.req.query("limit")) || 10
        const q = c.req.query("q") || ""

        const { data, total } = await this.service.getDownloadHistories(page, limit, q)
        return ApiResponse.paginate(c, ReportDownloadHistorySerializer.collection(data), total, page, limit, "Report download histories retrieved successfully")
    }
}
