import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

// ── Validators ──────────────────────────────────────────────────────────────
import { LoginValidator, ForgotPasswordValidator, ResetPasswordValidator, RefreshTokenValidator, GoogleLoginSchema, ResendVerificationValidator, SendOtpValidator, VerifyOtpValidator } from "../modules/auth/validators/auth.validator"
import { UpdateAccountValidator, UpdateBankValidator, UpdatePasswordValidator, UpdatePreferenceValidator, UpdatePhotoValidator } from "../modules/profile/validators/profile.validator"
import { CreateCashRedemptionValidator, CreateRedemptionVoucherValidator, CreateRedemptionProductValidator, ProcessProductRedemptionValidator, ProcessVoucherRedemptionValidator } from "../modules/redemption/validators/redemption.validator"
import { CreatePointValidator } from "../modules/point/validators/point.validator"
import { StoreFeedbackValidator } from "../modules/feedback/validators/feedback.validator"
import { CreateEducationCategoryValidator, UpdateEducationCategoryValidator } from "../modules/education-category/validators/education-category.validator"
import { CreateCatalogCategoryValidator, UpdateCatalogCategoryValidator } from "../modules/catalog-category/validators/catalog-category.validator"
import { CreatePointSubmissionValidator, UpdatePointSubmissionValidator, ApprovePointSubmissionValidator } from "../modules/point-submission/validators/point-submission.validator"
import { UpdateUserStatusValidator } from "../modules/user/validators/user.validator"

// ── Middlewares ──────────────────────────────────────────────────────────────
import { authMiddleware } from "../core/middlewares/auth.middleware"
import { apiKeyMiddleware } from "../core/middlewares/api-key.middleware"
import { roleMiddleware } from "../core/middlewares/role.middleware"
import { permissionMiddleware } from "../core/middlewares/permission.middleware"
import { rateLimitMiddleware } from "../core/middlewares/rate-limit.middleware"
import { validationHook } from "../core/helpers/validator"

// ── Modules (controllers wired with their dependencies) ──────────────────────
import { authController } from "../modules/auth/auth.module"
import { profileController } from "../modules/profile/profile.module"
import { pointController } from "../modules/point/point.module"
import { customerController } from "../modules/customer/customer.module"
import { customerServiceController } from "../modules/customer-service/customer-service.module"

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
import { pointSubmissionController } from "../modules/point-submission/point-submission.module"
import { roleController } from "../modules/role/role.module"

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = new Hono()

// Auth
routes.post("/auth/register", rateLimitMiddleware(5), (c) => authController.register(c))
routes.get("/auth/verify-email", (c) => authController.verifyEmail(c))
routes.post("/auth/resend-verification", rateLimitMiddleware(3), zValidator("json", ResendVerificationValidator, validationHook), (c) => authController.resendVerification(c))
routes.get("/auth/check-email-status", (c) => authController.checkEmailStatus(c))
routes.post("/auth/login", zValidator("json", LoginValidator, validationHook), (c) => authController.login(c))
routes.post("/auth/google", zValidator("json", GoogleLoginSchema, validationHook), (c) => authController.google(c))
routes.post("/auth/admin/google", zValidator("json", GoogleLoginSchema, validationHook), (c) => authController.adminGoogle(c))
routes.post("/auth/forgot-password", rateLimitMiddleware(3), zValidator("json", ForgotPasswordValidator, validationHook), (c) => authController.forgotPassword(c))
routes.get("/auth/validate-reset-token", (c) => authController.validateResetToken(c))
routes.post("/auth/reset-password", zValidator("json", ResetPasswordValidator, validationHook), (c) => authController.resetPassword(c))
routes.post("/auth/refresh", zValidator("json", RefreshTokenValidator, validationHook), (c) => authController.refreshToken(c))
routes.get("/auth/me", authMiddleware, (c) => authController.me(c))
routes.post("/auth/logout", authMiddleware, (c) => authController.logout(c))
routes.post("/auth/otp/send", rateLimitMiddleware(5), zValidator("json", SendOtpValidator, validationHook), (c) => authController.sendOtp(c))
routes.post("/auth/otp/verify", zValidator("json", VerifyOtpValidator, validationHook), (c) => authController.verifyOtp(c))

// Profile
routes.get("/profile", authMiddleware, roleMiddleware('user'), (c) => profileController.show(c))
routes.put("/profile/account", authMiddleware, roleMiddleware('user'), zValidator("json", UpdateAccountValidator, validationHook), (c) => profileController.updateAccount(c))
routes.put("/profile/bank", authMiddleware, roleMiddleware('user'), zValidator("json", UpdateBankValidator, validationHook), (c) => profileController.updateBank(c))
routes.put("/profile/preference", authMiddleware, roleMiddleware('user'), zValidator("json", UpdatePreferenceValidator, validationHook), (c) => profileController.updatePreference(c))
routes.put("/profile/password", authMiddleware, roleMiddleware('user'), zValidator("json", UpdatePasswordValidator, validationHook), (c) => profileController.updatePassword(c))
routes.post("/profile/photo", authMiddleware, roleMiddleware('user'), zValidator("form", UpdatePhotoValidator, validationHook), (c) => profileController.updatePhoto(c))
routes.post("/profile/complete-boarding", authMiddleware, roleMiddleware('user'), (c) => profileController.completeBoarding(c))
routes.post("/profile/documents", authMiddleware, roleMiddleware('user'), (c) => profileController.updateDocuments(c))

// Point
routes.get("/point", authMiddleware, roleMiddleware('user'), (c) => pointController.show(c))

// Redemption — Admin
routes.get("/redemption/cash/list", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.cash', 'L'), (c) => redemptionController.cashList(c))
routes.put("/redemption/cash/list/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.cash', 'E'), (c) => redemptionController.completeCash(c))
routes.get("/redemption/product/list", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.product', 'L'), (c) => redemptionController.productList(c))
routes.post("/redemption/product/list/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.product', 'E'), zValidator("json", ProcessProductRedemptionValidator, validationHook), (c) => redemptionController.processProduct(c))
routes.put("/redemption/product/list/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.product', 'E'), (c) => redemptionController.completeProduct(c))
routes.get("/redemption/voucher/list", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.voucher', 'L'), (c) => redemptionController.voucherList(c))
routes.post("/redemption/voucher/list/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.voucher', 'E'), zValidator("json", ProcessVoucherRedemptionValidator, validationHook), (c) => redemptionController.processVoucher(c))
routes.put("/redemption/voucher/list/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.voucher', 'E'), (c) => redemptionController.completeVoucher(c))
routes.get("/redemption/:id/status-histories", authMiddleware, roleMiddleware('admin'), permissionMiddleware('redemption.cash', 'L'), (c) => redemptionController.statusHistories(c))

// Redemption — User
routes.get("/redemption", authMiddleware, roleMiddleware('user'), (c) => redemptionController.index(c))
routes.get("/redemption/:id", authMiddleware, roleMiddleware('user'), (c) => redemptionController.show(c))
routes.post("/redemption/cash", authMiddleware, roleMiddleware('user'), zValidator("json", CreateCashRedemptionValidator, validationHook), (c) => redemptionController.storeCash(c))
routes.post("/redemption/voucher", authMiddleware, roleMiddleware('user'), zValidator("json", CreateRedemptionVoucherValidator, validationHook), (c) => redemptionController.storeVoucher(c))
routes.post("/redemption/product", authMiddleware, roleMiddleware('user'), zValidator("json", CreateRedemptionProductValidator, validationHook), (c) => redemptionController.storeProduct(c))

// Customer
routes.get("/customer", authMiddleware, roleMiddleware('user'), (c) => customerController.index(c))
routes.get("/customer/:id", authMiddleware, roleMiddleware('user'), (c) => customerController.show(c))
routes.get("/customer/:id/service", authMiddleware, roleMiddleware('user'), (c) => customerServiceController.byCustomer(c))
routes.get("/customer/:id/point", authMiddleware, roleMiddleware('user'), (c) => pointController.byCustomer(c))

// Service Promotion
routes.get("/service/promotion", authMiddleware, (c) => servicePromotionController.index(c))
routes.get("/service/promotion/:id", authMiddleware, (c) => servicePromotionController.show(c))
routes.post("/service/promotion", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'T'), (c) => servicePromotionController.store(c))
routes.put("/service/promotion/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'E'), (c) => servicePromotionController.update(c))
routes.delete("/service/promotion/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'H'), (c) => servicePromotionController.destroy(c))

// Template
routes.get("/template", authMiddleware, (c) => templateController.index(c))
routes.get("/template/:id", authMiddleware, roleMiddleware('user', 'admin'), (c) => templateController.show(c))
routes.get("/template/:id/download", authMiddleware, roleMiddleware('user', 'admin'), (c) => templateController.download(c))
routes.post("/template", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'T'), (c) => templateController.store(c))
routes.put("/template/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'E'), (c) => templateController.update(c))
routes.delete("/template/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'H'), (c) => templateController.destroy(c))

// Service
routes.get("/service", authMiddleware, roleMiddleware('user'), (c) => serviceController.index(c))
routes.get("/service/:code", authMiddleware, roleMiddleware('user'), (c) => serviceController.show(c))
routes.get("/service/:code/customer", authMiddleware, roleMiddleware('user'), (c) => customerServiceController.byService(c))

// Customer Service
routes.get("/customer-service", authMiddleware, roleMiddleware('user'), (c) => customerServiceController.index(c))

// Point (Reward)
routes.get("/point/reward", authMiddleware, roleMiddleware('user'), (c) => pointController.index(c))
routes.post("/point/reward", apiKeyMiddleware, zValidator("json", CreatePointValidator, validationHook), (c) => pointController.store(c))

// Statistic
routes.get("/statistic/count", authMiddleware, roleMiddleware('user'), (c) => statisticController.count(c))
routes.get("/statistic/point", authMiddleware, roleMiddleware('user'), (c) => statisticController.pointPerMonth(c))
routes.get("/statistic/customer", authMiddleware, roleMiddleware('user'), (c) => statisticController.customerStats(c))
routes.get("/statistic/redemption-point", authMiddleware, roleMiddleware('user'), (c) => statisticController.redemptionPointStats(c))
routes.get("/statistic/admin/summary", authMiddleware, roleMiddleware('admin'), permissionMiddleware('dashboard', 'L'), (c) => statisticController.adminSummary(c))

// Catalog Category
routes.get("/catalog/category", authMiddleware, (c) => catalogCategoryController.index(c))
routes.post("/catalog/category", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'T'), zValidator("json", CreateCatalogCategoryValidator, validationHook), (c) => catalogCategoryController.store(c))
routes.put("/catalog/category/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'E'), zValidator("json", UpdateCatalogCategoryValidator, validationHook), (c) => catalogCategoryController.update(c))
routes.delete("/catalog/category/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'H'), (c) => catalogCategoryController.destroy(c))

// Catalog
routes.get("/catalog", authMiddleware, (c) => catalogController.index(c))
routes.get("/catalog/:id", authMiddleware, (c) => catalogController.show(c))
routes.get("/catalog/:id/stock-history", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'L'), (c) => catalogController.stockHistory(c))
routes.post("/catalog", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'T'), (c) => catalogController.store(c))
routes.put("/catalog/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'E'), (c) => catalogController.update(c))
routes.delete("/catalog/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'H'), (c) => catalogController.destroy(c))
routes.post("/catalog/upload", authMiddleware, roleMiddleware('admin'), permissionMiddleware('catalog', 'T'), (c) => catalogController.uploadImage(c))

// Education
routes.get("/education/category", authMiddleware, (c) => educationCategoryController.index(c))
routes.post("/education/category", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'T'), zValidator("json", CreateEducationCategoryValidator, validationHook), (c) => educationCategoryController.store(c))
routes.put("/education/category/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'E'), zValidator("json", UpdateEducationCategoryValidator, validationHook), (c) => educationCategoryController.update(c))
routes.delete("/education/category/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'H'), (c) => educationCategoryController.destroy(c))

routes.get("/education/article", authMiddleware, (c) => educationArticleController.index(c))
routes.get("/education/article/:id", authMiddleware, (c) => educationArticleController.show(c))
routes.post("/education/article", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'T'), (c) => educationArticleController.store(c))
routes.put("/education/article/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'E'), (c) => educationArticleController.update(c))
routes.delete("/education/article/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'H'), (c) => educationArticleController.destroy(c))
routes.post("/education/article/upload", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'T'), (c) => educationArticleController.uploadImage(c))

routes.get("/education/video", authMiddleware, (c) => educationVideoController.index(c))
routes.get("/education/video/:id", authMiddleware, (c) => educationVideoController.show(c))
routes.post("/education/video", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'T'), (c) => educationVideoController.store(c))
routes.put("/education/video/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'E'), (c) => educationVideoController.update(c))
routes.delete("/education/video/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('education', 'H'), (c) => educationVideoController.destroy(c))

// Feedback
routes.get("/feedback", authMiddleware, (c) => feedbackController.index(c))
routes.post("/feedback", authMiddleware, zValidator("form", StoreFeedbackValidator, validationHook), (c) => feedbackController.store(c))

// User (Admin)
routes.get("/user", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.index(c))
routes.get("/user/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.show(c))
routes.get("/user/:id/services", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.services(c))
routes.get("/user/:id/point", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.rewards(c))
routes.get("/user/:id/redeem", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.redemptions(c))
routes.get("/user/:id/statistic", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.statistic(c))
routes.patch("/user/:id/status", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user.approval', 'E'), zValidator("json", UpdateUserStatusValidator, validationHook), (c) => userController.updateStatus(c))
routes.get("/user/:id/status-histories", authMiddleware, roleMiddleware('admin'), permissionMiddleware('user', 'L'), (c) => userController.statusHistories(c))

// Point Submission (Admin)
routes.get("/point-submission", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'L'), (c) => pointSubmissionController.index(c))
routes.get("/point-submission/check-account", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'L'), (c) => pointSubmissionController.checkAccount(c))
routes.get("/point-submission/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'L'), (c) => pointSubmissionController.show(c))
routes.post("/point-submission", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'T'), zValidator("json", CreatePointSubmissionValidator, validationHook), (c) => pointSubmissionController.store(c))
routes.put("/point-submission/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'E'), zValidator("json", UpdatePointSubmissionValidator, validationHook), (c) => pointSubmissionController.update(c))
routes.delete("/point-submission/:id", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'H'), (c) => pointSubmissionController.destroy(c))
routes.post("/point-submission/approve", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'E'), zValidator("json", ApprovePointSubmissionValidator, validationHook), (c) => pointSubmissionController.approve(c))

// NIS (Admin)
routes.get("/nis/account", authMiddleware, roleMiddleware('admin'), permissionMiddleware('point-submission', 'L'), (c) => pointSubmissionController.searchNisAccounts(c))

// Role Management (admin only)
const roleRoutes = new Hono()
roleRoutes.use("*", authMiddleware, roleMiddleware("admin"))
roleRoutes.get("/permission-matrix", permissionMiddleware('role', 'L'), (c) => roleController.permissionMatrix(c))
roleRoutes.get("/employees", permissionMiddleware('role', 'L'), (c) => roleController.employees(c))
roleRoutes.get("/", permissionMiddleware('role', 'L'), (c) => roleController.index(c))
roleRoutes.get("/:id", permissionMiddleware('role', 'L'), (c) => roleController.show(c))
roleRoutes.post("/", permissionMiddleware('role', 'T'), (c) => roleController.store(c))
roleRoutes.put("/:id", permissionMiddleware('role', 'E'), (c) => roleController.update(c))
roleRoutes.delete("/:id", permissionMiddleware('role', 'H'), (c) => roleController.destroy(c))

routes.route("/role", roleRoutes)

// Additional
routes.get("/additional/service", authMiddleware, (c) => additionalController.getServices(c))
routes.get("/additional/customer-type", authMiddleware, (c) => additionalController.getCustomerTypes(c))
routes.get("/additional/customer-service-status", authMiddleware, (c) => additionalController.getCustomerServiceStatus(c))
routes.get("/additional/point-type", authMiddleware, (c) => additionalController.getPointTypes(c))
routes.get("/additional/service-category", authMiddleware, (c) => additionalController.getServiceCategories(c))
routes.get("/additional/search", authMiddleware, (c) => additionalController.search(c))

// Proxy MinIO
routes.get("/proxy", async (c) => {
    const path = c.req.query("path")
    if (!path) return c.json({ message: "Missing 'path' query parameter" }, 400)

    const { minio } = await import("../core/helpers/minio")
    return minio.proxyHandler(path)
})

export default routes
