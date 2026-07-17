# API Reference

Base URL: `/api` — interactive docs at `GET /api/docs` (Swagger UI, spec: `/api/swagger.yaml`).

Source of truth: [src/routes/api.ts](../src/routes/api.ts). Every route lists its middleware
chain there; this document mirrors it.

**Legend**

- **Auth** — `Bearer` (JWT access token), `API Key` (`x-api-key` header), `-` (public)
- **Role** — `user` (referral partner), `admin` (employee), `*` (any authenticated)
- **Permission** — admin RBAC check `permissionMiddleware(module, action)`;
  actions: `L`=Lihat/view, `T`=Tambah/create, `E`=Edit, `H`=Hapus/delete
- **RL** — rate limited (n requests/minute per IP; disabled when `ENV=test`)

## Auth (`/auth`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | - | RL 5/min; JSON or multipart |
| GET | `/auth/verify-email?token=` | - | Verifies email, returns session |
| POST | `/auth/resend-verification` | - | RL 3/min |
| GET | `/auth/check-email-status?email=` | - | Email state (exists/verified/…) |
| POST | `/auth/login` | - | `{ identifier, password }` (email/phone) |
| POST | `/auth/google` | - | Google OAuth code → user session |
| POST | `/auth/admin/google` | - | Google OAuth code → **admin** (Employee) session |
| POST | `/auth/otp/send` | - | RL 5/min; OTP via email/WhatsApp (NusaContact) |
| POST | `/auth/otp/verify` | - | `{ identifier, code }` → session |
| POST | `/auth/forgot-password` | - | RL 3/min |
| GET | `/auth/validate-reset-token?token=` | - | |
| POST | `/auth/reset-password` | - | `{ token, newPassword }` |
| POST | `/auth/refresh` | - | `{ refreshToken }` → new token pair |
| GET | `/auth/me` | Bearer | Current user/employee (+permissions for admin) |
| POST | `/auth/logout` | Bearer | |

## Profile (`/profile`) — role `user`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/profile` | |
| PUT | `/profile/account` | Personal/company data |
| PUT | `/profile/bank` | Bank account for cash withdrawal |
| PUT | `/profile/preference` | `isSubscribe`, `isAutoWithdraw` |
| PUT | `/profile/password` | |
| POST | `/profile/photo` | multipart |
| POST | `/profile/documents` | multipart — KTP / bank book (boarding) |
| POST | `/profile/complete-boarding` | Marks boarding done → status `pending` |

## Customer & Service — role `user`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/customer` | Paginated; filters q/type/status/dates |
| GET | `/customer/:id` | |
| GET | `/customer/:id/service` | Customer's subscriptions |
| GET | `/customer/:id/point` | Rewards earned from this customer |
| GET | `/service` | Service catalog |
| GET | `/service/:code` | |
| GET | `/service/:code/customer` | Customers on a service |
| GET | `/customer-service` | All of the partner's customer subscriptions |

## Point & Reward

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/point` | Bearer | user | Available balance (lazy-expires overdue points) |
| GET | `/point/reward` | Bearer | user | Reward history |
| POST | `/point/reward` | API Key | - | Server-to-server reward creation |

## Redemption

User side (role `user`):

| Method | Path | Notes |
|--------|------|-------|
| GET | `/redemption` | Own history; filters `type[]`, `status[]` |
| GET | `/redemption/:id` | |
| POST | `/redemption/cash` | `{ pointsUsed }` — payout = poin × 1000 − 2,5% tax |
| POST | `/redemption/voucher` | `{ catalogId }` |
| POST | `/redemption/product` | `{ catalogId, address }` |

Admin side (role `admin`):

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/redemption/cash/list` | `redemption.cash` L | |
| PUT | `/redemption/cash/list/:id` | `redemption.cash` E | Complete cash payout |
| GET | `/redemption/product/list` | `redemption.product` L | |
| POST | `/redemption/product/list/:id` | `redemption.product` E | `{ shipper, trackingNumber }` |
| PUT | `/redemption/product/list/:id` | `redemption.product` E | Complete |
| GET | `/redemption/voucher/list` | `redemption.voucher` L | |
| POST | `/redemption/voucher/list/:id` | `redemption.voucher` E | `{ code, expiredDate? }` |
| PUT | `/redemption/voucher/list/:id` | `redemption.voucher` E | Complete |
| GET | `/redemption/:id/status-histories` | `redemption.cash` L | Status timeline |

## Statistic

| Method | Path | Role | Permission | Notes |
|--------|------|------|-----------|-------|
| GET | `/statistic/count` | user | | Customer/service/point counts + MoM trend |
| GET | `/statistic/point` | user | | Points per month |
| GET | `/statistic/customer?type=monthly\|yearly` | user | | |
| GET | `/statistic/redemption-point` | user | | Redemption status breakdown |
| GET | `/statistic/admin/summary` | admin | `dashboard` L | Global totals |

## Catalog (`/catalog`)

| Method | Path | Role | Permission |
|--------|------|------|-----------|
| GET | `/catalog` | * | |
| GET | `/catalog/:id` | * | |
| GET | `/catalog/:id/stock-history` | admin | `catalog` L |
| POST | `/catalog` | admin | `catalog` T |
| PUT | `/catalog/:id` | admin | `catalog` E |
| DELETE | `/catalog/:id` | admin | `catalog` H |
| POST | `/catalog/upload` | admin | `catalog` T |
| GET | `/catalog/category` | * | |
| POST / PUT / DELETE | `/catalog/category[/:id]` | admin | `catalog` T/E/H |

## Education (`/education`)

| Method | Path | Role | Permission | Notes |
|--------|------|------|-----------|-------|
| GET | `/education/category` | * | | |
| POST / PUT / DELETE | `/education/category[/:id]` | admin | `education` T/E/H | |
| GET | `/education/article[/:id]` | * | | `?isView=` publish filter |
| POST / PUT / DELETE | `/education/article[/:id]` | admin | `education` T/E/H | multipart |
| POST | `/education/article/upload` | admin | `education` T | Inline editor image |
| GET | `/education/video[/:id]` | * | | |
| POST / PUT / DELETE | `/education/video[/:id]` | admin | `education` T/E/H | multipart |

## Service Promotion & Template

| Method | Path | Role | Permission |
|--------|------|------|-----------|
| GET | `/service/promotion[/:id]` | * | |
| POST / PUT / DELETE | `/service/promotion[/:id]` | admin | `education` T/E/H |
| GET | `/template` | * | |
| GET | `/template/:id`, `/template/:id/download` | user, admin | |
| POST / PUT / DELETE | `/template[/:id]` | admin | `education` T/E/H |

## User Management (`/user`) — role `admin`

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/user` | `user` L | Referral partner list (`?status=`) |
| GET | `/user/:id` | `user` L | |
| GET | `/user/:id/services` | `user` L | |
| GET | `/user/:id/point` | `user` L | |
| GET | `/user/:id/redeem` | `user` L | |
| GET | `/user/:id/statistic` | `user` L | |
| PATCH | `/user/:id/status` | `user.approval` E | `{ status, note }` — approve/reject/revision/active/inactive |
| GET | `/user/:id/status-histories` | `user` L | |

## Point Submission (`/point-submission`) — role `admin`

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/point-submission` | `point-submission` L | |
| GET | `/point-submission/check-account` | `point-submission` L | Duplicate-account check |
| GET | `/point-submission/:id` | `point-submission` L | |
| POST | `/point-submission` | `point-submission` T | OTC/Bulanan, recurring option |
| PUT | `/point-submission/:id` | `point-submission` E | |
| DELETE | `/point-submission/:id` | `point-submission` H | |
| POST | `/point-submission/approve` | `point-submission` E | Bulk `{ ids[], notes? }` → enqueues `job_queues` |
| GET | `/nis/account?q=` | `point-submission` L | Search accounts in NIS DB |

## Role / RBAC (`/role`) — role `admin`

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/role/permission-matrix` | `role` L | Available modules + actions |
| GET | `/role/employees` | `role` L | Employees for assignment |
| GET | `/role[/:id]` | `role` L | |
| POST | `/role` | `role` T | `{ name, description?, color?, permissions?, employeeIds? }` |
| PUT | `/role/:id` | `role` E | |
| DELETE | `/role/:id` | `role` H | |

## Feedback, Additional, Misc

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/feedback` | Bearer | |
| POST | `/feedback` | Bearer | multipart; forwarded to Google AppScript (`FEEDBACK_URL`) |
| GET | `/additional/service` | Bearer | Enum options for filters |
| GET | `/additional/customer-type` | Bearer | |
| GET | `/additional/customer-service-status` | Bearer | |
| GET | `/additional/point-type` | Bearer | |
| GET | `/additional/service-category` | Bearer | |
| GET | `/additional/search?q=` | Bearer | Global search → `{ title, module, route }` |
| GET | `/proxy?path=` | - | MinIO object proxy (images/files) |

## Response Envelope

```json
// success
{ "success": true, "statusCode": 200, "message": "...", "data": ...,
  "meta": { "total": 0, "perPage": 10, "currentPage": 1, "lastPage": 1, "from": 1, "to": 10 } }

// error (exceptions / Zod validation)
{ "success": false, "statusCode": 422, "message": "...", "errors": [ { "field": "...", "message": "..." } ] }
```

`meta` only on paginated lists. Common list params: `q`, `sort`, `order`, `page`, `limit`,
`startDate`, `endDate`, plus module-specific filters (arrays passed as `key[]=`).
