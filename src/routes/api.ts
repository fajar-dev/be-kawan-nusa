import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CustomerController } from '../modules/customer/customer.controller'
import { CustomerServiceController } from '../modules/customer-service/customer-service.controller'
import { ServiceController } from '../modules/service/service.controller'
import { RewardController } from '../modules/reward/reward.controller'
import { CreateRewardValidator } from '../modules/reward/validators/reward.validator'
import { AuthController } from '../modules/auth/auth.controller'
import { RegisterValidator, LoginValidator, ForgotPasswordValidator, ResetPasswordValidator, RefreshTokenValidator } from '../modules/auth/validators/auth.validator'
import { authMiddleware } from '../core/middlewares/auth.middleware'
import { apiKeyMiddleware } from '../core/middlewares/api-key.middleware'
import { tokenAuthMiddleware } from '../core/middlewares/token-auth.middleware'
import { ProfileController } from '../modules/profile/profile.controller'
import { UpdateAccountValidator, UpdateBankValidator, UpdatePasswordValidator, UpdatePreferenceValidator, UpdatePhotoValidator } from '../modules/profile/validators/profile.validator'
import { PointController } from '../modules/point/point.controller'
import { StatisticController } from '../modules/statistic/statistic.controller'
import { RedemptionController } from '../modules/redemption/redemption.controller'
import { CreateCashRedemptionValidator, CreateRedemptionVoucherValidator, CreateRedemptionProductValidator } from '../modules/redemption/validators/redemption.validator'
import { AdditionalController } from '../modules/additional/additional.controller'
import { CatalogCategoryController } from '../modules/catalog-category/catalog-category.controller'
import { CatalogController } from '../modules/catalog/catalog.controller'
import { EducationCategoryController } from '../modules/education-category/education-category.controller'
import { EducationArticleController } from '../modules/education-article/education-article.controller'
import { EducationVideoController } from '../modules/education-video/education-video.controller'
import { ServicePromotionController } from '../modules/service-promotion/service-promotion.controller'
import { TemplateController } from '../modules/template/template.controller'
import { validationHook } from '../core/helpers/validator'

const routes = new Hono()
const customerController = new CustomerController()
const customerServiceController = new CustomerServiceController()
const serviceController = new ServiceController()
const rewardController = new RewardController()
const authController = new AuthController()
const profileController = new ProfileController()
const pointController = new PointController()
const statisticController = new StatisticController()
const redemptionController = new RedemptionController()
const additionalController = new AdditionalController()
const catalogCategoryController = new CatalogCategoryController()
const catalogController = new CatalogController()
const educationCategoryController = new EducationCategoryController()
const educationArticleController = new EducationArticleController()
const educationVideoController = new EducationVideoController()
const servicePromotionController = new ServicePromotionController()
const templateController = new TemplateController()


// Auth Routes
routes.post('/auth/register', zValidator('json', RegisterValidator, validationHook), (c) => authController.register(c))
routes.post('/auth/login', zValidator('json', LoginValidator, validationHook), (c) => authController.login(c))
routes.post('/auth/forgot-password', zValidator('json', ForgotPasswordValidator, validationHook), (c) => authController.forgotPassword(c))
routes.get('/auth/validate-reset-token', (c) => authController.validateResetToken(c))
routes.post('/auth/reset-password', zValidator('json', ResetPasswordValidator, validationHook), (c) => authController.resetPassword(c))
routes.post('/auth/refresh', zValidator('json', RefreshTokenValidator, validationHook), (c) => authController.refreshToken(c))
routes.get('/auth/me', authMiddleware, (c) => authController.me(c))
routes.post('/auth/logout', authMiddleware, (c) => authController.logout(c))

// Profile Routes
routes.get('/profile', authMiddleware, (c) => profileController.show(c))
routes.put('/profile/account', authMiddleware, zValidator('json', UpdateAccountValidator, validationHook), (c) => profileController.updateAccount(c))
routes.put('/profile/bank', authMiddleware, zValidator('json', UpdateBankValidator, validationHook), (c) => profileController.updateBank(c))
routes.put('/profile/preference', authMiddleware, zValidator('json', UpdatePreferenceValidator, validationHook), (c) => profileController.updatePreference(c))
routes.put('/profile/password', authMiddleware, zValidator('json', UpdatePasswordValidator, validationHook), (c) => profileController.updatePassword(c))
routes.post('/profile/photo', authMiddleware, zValidator('form', UpdatePhotoValidator, validationHook), (c) => profileController.updatePhoto(c))

// Point Routes
routes.get('/point', authMiddleware, (c) => pointController.show(c))

// Redemption Routes
routes.get('/redemption', authMiddleware, (c) => redemptionController.index(c))
routes.get('/redemption/:id', authMiddleware, (c) => redemptionController.show(c))
routes.get('/redemption/:id/receipt', tokenAuthMiddleware, (c) => redemptionController.previewReceipt(c))
routes.get('/redemption/:id/receipt/download', tokenAuthMiddleware, (c) => redemptionController.downloadReceipt(c))
routes.post('/redemption/cash', authMiddleware, zValidator('json', CreateCashRedemptionValidator, validationHook), (c) => redemptionController.storeCash(c))
routes.post('/redemption/voucher', authMiddleware, zValidator('json', CreateRedemptionVoucherValidator, validationHook), (c) => redemptionController.storeVoucher(c))
routes.post('/redemption/product', authMiddleware, zValidator('json', CreateRedemptionProductValidator, validationHook), (c) => redemptionController.storeProduct(c))

// Customer Routes
routes.get('/customer', authMiddleware, (c) => customerController.index(c))
routes.get('/customer/:id', authMiddleware, (c) => customerController.show(c))
routes.get('/customer/:id/service', authMiddleware, (c) => customerServiceController.byCustomer(c))
routes.get('/customer/:id/reward', authMiddleware, (c) => rewardController.byCustomer(c))

// Service Promotion Routes
routes.get('/service/promotion', authMiddleware, (c) => servicePromotionController.index(c))

// Template Routes
routes.get('/template', authMiddleware, (c) => templateController.index(c))
routes.get('/template/:id', authMiddleware, (c) => templateController.show(c))

// Service Routes
routes.get('/service', authMiddleware, (c) => serviceController.index(c))
routes.get('/service/:code', authMiddleware, (c) => serviceController.show(c))
routes.get('/service/:code/customer', authMiddleware, (c) => customerServiceController.byService(c))

// Customer Service Routes
routes.get('/customer-service', authMiddleware, (c) => customerServiceController.index(c))

// Reward Routes
routes.get('/reward', authMiddleware, (c) => rewardController.index(c))
routes.post('/reward', apiKeyMiddleware, zValidator('json', CreateRewardValidator, validationHook), (c) => rewardController.store(c))

// Statistic Routes
routes.get('/statistic/count', authMiddleware, (c) => statisticController.count(c))
routes.get('/statistic/point', authMiddleware, (c) => statisticController.pointPerMonth(c))
routes.get('/statistic/customer', authMiddleware, (c) => statisticController.customerStats(c))
routes.get('/statistic/redemption-reward', authMiddleware, (c) => statisticController.redemptionRewardStats(c))

// Catalog Routes
routes.get('/catalog/category', authMiddleware, (c) => catalogCategoryController.index(c))
routes.get('/catalog', authMiddleware, (c) => catalogController.index(c))
routes.get('/catalog/:id', authMiddleware, (c) => catalogController.show(c))

// Education Routes
routes.get('/education/category', authMiddleware, (c) => educationCategoryController.index(c))
routes.get('/education/article', authMiddleware, (c) => educationArticleController.index(c))
routes.get('/education/article/:id', authMiddleware, (c) => educationArticleController.show(c))
routes.get('/education/video', authMiddleware, (c) => educationVideoController.index(c))
routes.get('/education/video/:id', authMiddleware, (c) => educationVideoController.show(c))

// Additional Routes
routes.get('/additional/service', authMiddleware, (c) => additionalController.getServices(c))
routes.get('/additional/customer-type', authMiddleware, (c) => additionalController.getCustomerTypes(c))
routes.get('/additional/customer-service-status', authMiddleware, (c) => additionalController.getCustomerServiceStatus(c))
routes.get('/additional/reward-point-type', authMiddleware, (c) => additionalController.getRewardPointTypes(c))
routes.get('/additional/service-category', authMiddleware, (c) => additionalController.getServiceCategories(c))

export default routes
