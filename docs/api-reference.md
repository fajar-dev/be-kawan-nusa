# API Reference

Base URL: `/api`

## Auth

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/register` | - | - | Register new user |
| POST | `/auth/login` | - | - | Login (email/phone + password) |
| POST | `/auth/google` | - | - | Google OAuth login (user) |
| POST | `/auth/admin/google` | - | - | Google OAuth login (admin) |
| POST | `/auth/forgot-password` | - | - | Request password reset |
| GET | `/auth/validate-reset-token` | - | - | Validate reset token |
| POST | `/auth/reset-password` | - | - | Reset password |
| POST | `/auth/refresh` | - | - | Refresh access token |
| GET | `/auth/me` | Bearer | * | Get current user |
| POST | `/auth/logout` | Bearer | * | Logout |

## Profile

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/profile` | Bearer | user | Get profile |
| PUT | `/profile/account` | Bearer | user | Update account info |
| PUT | `/profile/bank` | Bearer | user | Update bank info |
| PUT | `/profile/preference` | Bearer | user | Update preferences |
| PUT | `/profile/password` | Bearer | user | Change password |
| POST | `/profile/photo` | Bearer | user | Upload photo |

## Customer

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/customer` | Bearer | user | List (page, limit, search, type) |
| GET | `/customer/:id` | Bearer | user | Detail |
| GET | `/customer/:id/service` | Bearer | user | Customer's services |
| GET | `/customer/:id/reward` | Bearer | user | Customer's rewards |

## Customer Service

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/customer-service` | Bearer | user | List (page, limit, search, status) |

## Service

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/service` | Bearer | user | List services |
| GET | `/service/:code` | Bearer | user | Service by code |
| GET | `/service/:code/customer` | Bearer | user | Customers of service |

## Service Promotion

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/service/promotion` | Bearer | * | List (page, limit) |
| GET | `/service/promotion/:id` | Bearer | * | Detail |
| POST | `/service/promotion` | Bearer | admin | Create |
| PUT | `/service/promotion/:id` | Bearer | admin | Update |
| DELETE | `/service/promotion/:id` | Bearer | admin | Delete |

## Point

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/point` | Bearer | user | Point balance |

## Reward

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/reward` | Bearer | user | List (page, limit, pointType, startDate, endDate) |
| POST | `/reward` | API Key | - | Create reward (server-to-server) |

## Redemption (User)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/redemption` | Bearer | user | List (page, limit, type, status) |
| GET | `/redemption/:id` | Bearer | user | Detail |
| POST | `/redemption/cash` | Bearer | user | Redeem cash |
| POST | `/redemption/voucher` | Bearer | user | Redeem voucher |
| POST | `/redemption/product` | Bearer | user | Redeem product |

## Redemption (Admin)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/redemption/cash/list` | Bearer | admin | Cash list |
| PUT | `/redemption/cash/list/:id` | Bearer | admin | Complete cash |
| GET | `/redemption/product/list` | Bearer | admin | Product list |
| POST | `/redemption/product/list/:id` | Bearer | admin | Process product |
| PUT | `/redemption/product/list/:id` | Bearer | admin | Complete product |
| GET | `/redemption/voucher/list` | Bearer | admin | Voucher list |
| POST | `/redemption/voucher/list/:id` | Bearer | admin | Process voucher |
| PUT | `/redemption/voucher/list/:id` | Bearer | admin | Complete voucher |

## Catalog

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/catalog` | Bearer | * | List (page, limit, category, search) |
| GET | `/catalog/:id` | Bearer | * | Detail |
| POST | `/catalog` | Bearer | admin | Create |
| PUT | `/catalog/:id` | Bearer | admin | Update |
| DELETE | `/catalog/:id` | Bearer | admin | Delete |
| POST | `/catalog/upload` | Bearer | admin | Upload image |

## Catalog Category

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/catalog/category` | Bearer | * | List |
| POST | `/catalog/category` | Bearer | admin | Create |
| PUT | `/catalog/category/:id` | Bearer | admin | Update |
| DELETE | `/catalog/category/:id` | Bearer | admin | Delete |

## Education Category

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/education/category` | Bearer | * | List |
| POST | `/education/category` | Bearer | admin | Create |
| PUT | `/education/category/:id` | Bearer | admin | Update |
| DELETE | `/education/category/:id` | Bearer | admin | Delete |

## Education Article

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/education/article` | Bearer | * | List (page, limit, category, search) |
| GET | `/education/article/:id` | Bearer | * | Detail |
| POST | `/education/article` | Bearer | admin | Create |
| PUT | `/education/article/:id` | Bearer | admin | Update |
| DELETE | `/education/article/:id` | Bearer | admin | Delete |
| POST | `/education/article/upload` | Bearer | admin | Upload image |

## Education Video

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/education/video` | Bearer | * | List (page, limit, category) |
| GET | `/education/video/:id` | Bearer | * | Detail |
| POST | `/education/video` | Bearer | admin | Create |
| PUT | `/education/video/:id` | Bearer | admin | Update |
| DELETE | `/education/video/:id` | Bearer | admin | Delete |

## Feedback

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/feedback` | Bearer | * | List |
| POST | `/feedback` | Bearer | * | Submit (form: category, message, attachment) |

## Template

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/template` | Bearer | * | List (page, limit) |
| GET | `/template/:id` | Bearer | * | Detail |
| GET | `/template/:id/download` | Bearer | * | Download file |
| POST | `/template` | Bearer | admin | Create |
| PUT | `/template/:id` | Bearer | admin | Update |
| DELETE | `/template/:id` | Bearer | admin | Delete |

## Statistic

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/statistic/count` | Bearer | user | Dashboard counts |
| GET | `/statistic/point` | Bearer | user | Point per month (year) |
| GET | `/statistic/customer` | Bearer | user | Customer stats |
| GET | `/statistic/redemption-reward` | Bearer | user | Redemption/reward stats |
| GET | `/statistic/admin/summary` | Bearer | admin | Admin dashboard |

## User (Admin)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/user` | Bearer | admin | List (page, limit, search) |
| GET | `/user/:id` | Bearer | admin | Detail |
| GET | `/user/:id/services` | Bearer | admin | User's services |
| GET | `/user/:id/reward` | Bearer | admin | User's rewards |
| GET | `/user/:id/redeem` | Bearer | admin | User's redemptions |
| GET | `/user/:id/statistic` | Bearer | admin | User's statistics |

## Additional

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/additional/service` | Bearer | * | Service dropdown |
| GET | `/additional/customer-type` | Bearer | * | Customer type dropdown |
| GET | `/additional/customer-service-status` | Bearer | * | Status dropdown |
| GET | `/additional/reward-point-type` | Bearer | * | Point type dropdown |
| GET | `/additional/service-category` | Bearer | * | Service category dropdown |
| GET | `/additional/search` | Bearer | * | Global search (q) |

## Proxy

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/proxy?path=...` | - | - | MinIO file proxy |
