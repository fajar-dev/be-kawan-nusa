import { ReportDownloadHistoryRepository } from "./repositories/report-download-history.repository"
import { ReportService } from "./report.service"
import { ReportController } from "./report.controller"
import { TypeOrmUnitOfWork } from "../../core/interfaces/unit-of-work.interface"
import { branchService } from "../branch/branch.module"
import { serviceService } from "../service/service.module"

const historyRepository = new ReportDownloadHistoryRepository()
export const reportService = new ReportService(historyRepository, new TypeOrmUnitOfWork())
export const reportController = new ReportController(reportService, branchService, serviceService)
