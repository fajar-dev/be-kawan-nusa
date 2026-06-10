import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

// ── Validators ──────────────────────────────────────────────────────────────
import { RegisterValidator, LoginValidator, ForgotPasswordValidator, ResetPasswordValidator, RefreshTokenValidator, GoogleLoginSchema } from "../modules/auth/validators/auth.validator"
import { UpdateAccountValidator, UpdateBankValidator, UpdatePasswordValidator, UpdatePreferenceValidator, UpdatePhotoValidator } from "../modules/profile/validators/profile.validator"
import { CreateCashRedemptionValidator, CreateRedemptionVoucherValidator, CreateRedemptionProductValidator } from "../modules/redemption/validators/redemption.validator"
import { CreateRewardValidator } from "../modules/reward/validators/reward.validator"
import { StoreFeedbackValidator } from "../modules/feedback/validators/feedback.validator"

// ── Middlewares ──────────────────────────────────────────────────────────────
import { authMiddleware } from "../core/middlewares/auth.middleware"
import { apiKeyMiddleware } from "../core/middlewares/api-key.middleware"
import { tokenAuthMiddleware } from "../core/middlewares/token-auth.middleware"
import { validationHook } from "../core/helpers/validator"

// ── Modules (controllers wired with their dependencies) ──────────────────────
import { authController } from "../modules/auth/auth.module"
import { profileController } from "../modules/profile/profile.module"
import { pointController } from "../modules/point/point.module"
import { customerController } from "../modules/customer/customer.module"
import { customerServiceController } from "../modules/customer-service/customer-service.module"
import { rewardController } from "../modules/reward/reward.module"
import { redemptionController } from "../modules/redemption/redemption.module"
import { catalogController } from "../modules/catalog/catalog.module"
import { catalogCategoryController } from "../modules/catalog-category/catalog-category.module"
import { educationCategoryController } from "../modules/education-category/education-category.module"
import { educationArticleController } from "../modules/education-article/education-article.module"
import { educationVideoController } from "../modules/education-video/education-video.module"
import { serviceController } from "../modules/service/service.module"
import { servicePromotionController } from "../modules/service-promotion/service-promotion.module"
import { statisticController } from "../modules/statistic/statistic.module"
import { additionalController } from "../modules/additional/additional.module"
import { feedbackController } from "../modules/feedback/feedback.module"
import { templateController } from "../modules/template/template.module"
import { userController } from "../modules/user/user.module"
import { roleMiddleware } from "../core/middlewares/role.middleware"

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = new Hono()

// Auth
routes.post("/auth/register", zValidator("json", RegisterValidator, validationHook), (c) => authController.register(c))
routes.post("/auth/login", zValidator("json", LoginValidator, validationHook), (c) => authController.login(c))
routes.post("/auth/google", zValidator("json", GoogleLoginSchema, validationHook), (c) => authController.google(c))
routes.post("/auth/admin/google", zValidator("json", GoogleLoginSchema, validationHook), (c) => authController.adminGoogle(c))
routes.post("/auth/forgot-password", zValidator("json", ForgotPasswordValidator, validationHook), (c) => authController.forgotPassword(c))
routes.get("/auth/validate-reset-token", (c) => authController.validateResetToken(c))
routes.post("/auth/reset-password", zValidator("json", ResetPasswordValidator, validationHook), (c) => authController.resetPassword(c))
routes.post("/auth/refresh", zValidator("json", RefreshTokenValidator, validationHook), (c) => authController.refreshToken(c))
routes.get("/auth/me", authMiddleware, (c) => authController.me(c))
routes.post("/auth/logout", authMiddleware, (c) => authController.logout(c))

// Profile
routes.get("/profile", authMiddleware, roleMiddleware('user'), (c) => profileController.show(c))
routes.put("/profile/account", authMiddleware, roleMiddleware('user'), zValidator("json", UpdateAccountValidator, validationHook), (c) => profileController.updateAccount(c))
routes.put("/profile/bank", authMiddleware, roleMiddleware('user'), zValidator("json", UpdateBankValidator, validationHook), (c) => profileController.updateBank(c))
routes.put("/profile/preference", authMiddleware, roleMiddleware('user'), zValidator("json", UpdatePreferenceValidator, validationHook), (c) => profileController.updatePreference(c))
routes.put("/profile/password", authMiddleware, roleMiddleware('user'), zValidator("json", UpdatePasswordValidator, validationHook), (c) => profileController.updatePassword(c))
routes.post("/profile/photo", authMiddleware, roleMiddleware('user'), zValidator("form", UpdatePhotoValidator, validationHook), (c) => profileController.updatePhoto(c))

// Point
routes.get("/point", authMiddleware, roleMiddleware('user'), (c) => pointController.show(c))

// Redemption
routes.get("/redemption", authMiddleware, roleMiddleware('user'), (c) => redemptionController.index(c))
routes.get("/redemption/:id", authMiddleware, roleMiddleware('user'), (c) => redemptionController.show(c))
routes.get("/redemption/:id/receipt", tokenAuthMiddleware, (c) => redemptionController.previewReceipt(c))
routes.get("/redemption/:id/receipt/download", tokenAuthMiddleware, (c) => redemptionController.downloadReceipt(c))
routes.post("/redemption/cash", authMiddleware, roleMiddleware('user'), zValidator("json", CreateCashRedemptionValidator, validationHook), (c) => redemptionController.storeCash(c))
routes.post("/redemption/voucher", authMiddleware, roleMiddleware('user'), zValidator("json", CreateRedemptionVoucherValidator, validationHook), (c) => redemptionController.storeVoucher(c))
routes.post("/redemption/product", authMiddleware, roleMiddleware('user'), zValidator("json", CreateRedemptionProductValidator, validationHook), (c) => redemptionController.storeProduct(c))

// Customer
routes.get("/customer", authMiddleware, roleMiddleware('user'), (c) => customerController.index(c))
routes.get("/customer/:id", authMiddleware, roleMiddleware('user'), (c) => customerController.show(c))
routes.get("/customer/:id/service", authMiddleware, roleMiddleware('user'), (c) => customerServiceController.byCustomer(c))
routes.get("/customer/:id/reward", authMiddleware, roleMiddleware('user'), (c) => rewardController.byCustomer(c))

// Service Promotion
routes.get("/service/promotion", authMiddleware, (c) => servicePromotionController.index(c))

// Template
routes.get("/template", authMiddleware, (c) => templateController.index(c))
routes.get("/template/:id", authMiddleware, roleMiddleware('user'), (c) => templateController.show(c))
routes.get("/template/:id/download", authMiddleware, roleMiddleware('user'), (c) => templateController.download(c))

// Service
routes.get("/service", authMiddleware, roleMiddleware('user'), (c) => serviceController.index(c))
routes.get("/service/:code", authMiddleware, roleMiddleware('user'), (c) => serviceController.show(c))
routes.get("/service/:code/customer", authMiddleware, roleMiddleware('user'), (c) => customerServiceController.byService(c))

// Customer Service
routes.get("/customer-service", authMiddleware, roleMiddleware('user'), (c) => customerServiceController.index(c))

// Reward
routes.get("/reward", authMiddleware, roleMiddleware('user'), (c) => rewardController.index(c))
routes.post("/reward", apiKeyMiddleware, roleMiddleware('admin'), zValidator("json", CreateRewardValidator, validationHook), (c) => rewardController.store(c))

// Statistic
routes.get("/statistic/count", authMiddleware, roleMiddleware('user'), (c) => statisticController.count(c))
routes.get("/statistic/point", authMiddleware, roleMiddleware('user'), (c) => statisticController.pointPerMonth(c))
routes.get("/statistic/customer", authMiddleware, roleMiddleware('user'), (c) => statisticController.customerStats(c))
routes.get("/statistic/redemption-reward", authMiddleware, roleMiddleware('user'), (c) => statisticController.redemptionRewardStats(c))

// Catalog
routes.get("/catalog/category", authMiddleware, (c) => catalogCategoryController.index(c))
routes.get("/catalog", authMiddleware, (c) => catalogController.index(c))
routes.get("/catalog/:id", authMiddleware, (c) => catalogController.show(c))

// Education
routes.get("/education/category", authMiddleware, (c) => educationCategoryController.index(c))
routes.get("/education/article", authMiddleware, (c) => educationArticleController.index(c))
routes.get("/education/article/:id", authMiddleware, (c) => educationArticleController.show(c))
routes.get("/education/video", authMiddleware, (c) => educationVideoController.index(c))
routes.get("/education/video/:id", authMiddleware, (c) => educationVideoController.show(c))

// Feedback
routes.get("/feedback", authMiddleware, (c) => feedbackController.index(c))
routes.post("/feedback", authMiddleware, zValidator("form", StoreFeedbackValidator, validationHook), (c) => feedbackController.store(c))

// User
routes.get("/user", authMiddleware, roleMiddleware('admin'), (c) => userController.index(c))

// Additional
routes.get("/additional/service", authMiddleware, (c) => additionalController.getServices(c))
routes.get("/additional/customer-type", authMiddleware, (c) => additionalController.getCustomerTypes(c))
routes.get("/additional/customer-service-status", authMiddleware, (c) => additionalController.getCustomerServiceStatus(c))
routes.get("/additional/reward-point-type", authMiddleware, (c) => additionalController.getRewardPointTypes(c))
routes.get("/additional/service-category", authMiddleware, (c) => additionalController.getServiceCategories(c))
routes.get("/additional/search", authMiddleware, (c) => additionalController.search(c))

export default routes
