import "reflect-metadata"
import { DataSource } from "typeorm"
import { Customer } from "../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/entities/customer-email.entity"
import { Service } from "../modules/service/entities/service.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { CustomerServiceReferral } from "../modules/customer-service/entities/customer-service-referral.entity"
import { User } from "../modules/user/entities/user.entity"
import { UserStatusHistory } from "../modules/user/entities/user-status-history.entity"
import { Point } from "../modules/point/entities/point.entity"
import { Catalog } from "../modules/catalog/entities/catalog.entity"
import { CatalogStockHistory } from "../modules/catalog/entities/catalog-stock-history.entity"
import { CatalogCategory } from "../modules/catalog-category/entities/catalog-category.entity"
import { Redemption } from "../modules/redemption/entities/redemption.entity"
import { RedemptionWithdraw } from "../modules/redemption/entities/redemption-withdraw.entity"
import { RedemptionVoucher } from "../modules/redemption/entities/redemption-voucher.entity"
import { RedemptionProduct } from "../modules/redemption/entities/redemption-product.entity"
import { RedemptionProductShipping } from "../modules/redemption/entities/redemption-product-shipping.entity"
import { RedemptionVoucherDetail } from "../modules/redemption/entities/redemption-voucher-detail.entity"
import { RedemptionStatusHistory } from "../modules/redemption/entities/redemption-status-history.entity"
import { EducationCategory } from "../modules/education-category/entities/education-category.entity"
import { EducationArticle } from "../modules/education-article/entities/education-article.entity"
import { EducationArticleView } from "../modules/education-article/entities/education-article-view.entity"
import { EducationVideo } from "../modules/education-video/entities/education-video.entity"
import { EducationVideoView } from "../modules/education-video/entities/education-video-view.entity"
import { ServicePromotion } from "../modules/service-promotion/entities/service-promotion.entity"
import { Template } from "../modules/template/entities/template.entity"
import { Employee } from "../modules/employee/entities/employee.entity"
import { PasswordResetToken } from "../modules/auth/entities/password-reset-token.entity"
import { EmailVerificationToken } from "../modules/auth/entities/email-verification-token.entity"
import { OtpToken } from "../modules/auth/entities/otp-token.entity"
import { PointSubmission } from "../modules/point-submission/entities/point-submission.entity"
import { JobQueue } from "../core/queue/entities/job-queue.entity"
import { JobQueueFailure } from "../core/queue/entities/job-queue-failure.entity"
import { config } from "./config"

/**
 * TypeORM Database Configuration
 * Uses centralized config from config.ts
 */
export const AppDataSource = new DataSource({
    type: "mysql",
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.pass,
    database: config.database.name,
    synchronize: config.database.sync,
    entities: [Customer, CustomerPhone, CustomerEmail, Service, CustomerService, CustomerServiceReferral, User, UserStatusHistory, Point, Catalog, CatalogStockHistory, CatalogCategory, Redemption, RedemptionWithdraw, RedemptionVoucher, RedemptionProduct, RedemptionProductShipping, RedemptionVoucherDetail, RedemptionStatusHistory, EducationCategory, EducationArticle, EducationArticleView, EducationVideo, EducationVideoView, ServicePromotion, Template, Employee, PasswordResetToken, EmailVerificationToken, OtpToken, PointSubmission, JobQueue, JobQueueFailure],
    migrations: [],
    subscribers: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci",
    extra: {
        multipleStatements: true
    }
})
