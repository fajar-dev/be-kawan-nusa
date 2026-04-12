import "reflect-metadata"
import { DataSource } from "typeorm"
import { Customer } from "../modules/customer/entities/customer.entity"
import { CustomerPhone } from "../modules/customer/entities/customer-phone.entity"
import { CustomerEmail } from "../modules/customer/entities/customer-email.entity"
import { Service } from "../modules/service/entities/service.entity"
import { CustomerService } from "../modules/customer-service/entities/customer-service.entity"
import { User } from "../modules/user/entities/user.entity"
import { Reward } from "../modules/reward/entities/reward.entity"
import { Catalog } from "../modules/catalog/entities/catalog.entity"
import { CatalogCategory } from "../modules/catalog-category/entities/catalog-category.entity"
import { Redemption } from "../modules/redemption/entities/redemption.entity"
import { RedemptionWithdraw } from "../modules/redemption/entities/redemption-withdraw.entity"
import { RedemptionVoucher } from "../modules/redemption/entities/redemption-voucher.entity"
import { RedemptionProduct } from "../modules/redemption/entities/redemption-product.entity"
import { RedemptionProductShipping } from "../modules/redemption/entities/redemption-product-shipping.entity"
import { RedemptionVoucherDetail } from "../modules/redemption/entities/redemption-voucher-detail.entity"
import { EducationCategory } from "../modules/education-category/entities/education-category.entity"
import { EducationArticle } from "../modules/education-article/entities/education-article.entity"
import { EducationArticleView } from "../modules/education-article/entities/education-article-view.entity"
import { EducationVideo } from "../modules/education-video/entities/education-video.entity"
import { EducationVideoView } from "../modules/education-video/entities/education-video-view.entity"
import { ServicePromotion } from "../modules/service-promotion/entities/service-promotion.entity"
import { Template } from "../modules/template/entities/template.entity"
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
    entities: [Customer, CustomerPhone, CustomerEmail, Service, CustomerService, User, Reward, Catalog, CatalogCategory, Redemption, RedemptionWithdraw, RedemptionVoucher, RedemptionProduct, RedemptionProductShipping, RedemptionVoucherDetail, EducationCategory, EducationArticle, EducationArticleView, EducationVideo, EducationVideoView, ServicePromotion, Template],
    migrations: [],
    subscribers: [],
    connectorPackage: "mysql2",
    charset: "utf8mb4_unicode_ci"
})
