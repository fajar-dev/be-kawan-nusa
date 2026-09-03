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
| GET | `/point-submission` | `point-submission` L | Paginated; filters q/status/type/dates + nisData branchCode[]/serviceCode[]/salesEmployeeId[] |
| GET | `/point-submission/check-account` | `point-submission` L | Duplicate-account check |
| GET | `/point-submission/:id` | `point-submission` L | |
| POST | `/point-submission` | `point-submission` T | OTC/Bulanan, recurring option |
| PUT | `/point-submission/:id` | `point-submission` E | |
| DELETE | `/point-submission/:id` | `point-submission` H | |
| POST | `/point-submission/approve` | `point-submission` E | Bulk `{ ids[], notes? }` → enqueues `job_queues` |
| GET | `/point-submission/schedule` | `point-submission` L | Monthly (Bulanan) recurring schedules; filters q/isActive/branchCode[]/serviceCode[]/stoppedStartDate/stoppedEndDate; sort incl. branchCode/custId/serviceName |
| PATCH | `/point-submission/schedule/:id` | `point-submission` E | Adjust `{ price?, anchorDay? }` (at least one) — records to schedule history |
| GET | `/point-submission/schedule/:id/history` | `point-submission` L | Adjustment history: who/when/from/to |
| PATCH | `/point-submission/schedule/:id/stop` | `point-submission` E | Deactivates the schedule |
| GET | `/nis/account?q=` | `point-submission` L | Search accounts in NIS DB |

## Rate Commission (`/rate-commission`) — role `admin`

A service may have at most **one** rate per category (OTC / Bulanan) — creating a second one for
the same service+category fails with 400; edit the existing row instead.

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/rate-commission` | `rate-commission` L | Paginated; filters q/category/type/startDateFrom/startDateTo, sort incl. service/value/type/startDate/endDate |
| GET | `/rate-commission/taken-services?category=` | `rate-commission` L | Service codes already used for that category (for the create form) |
| GET | `/rate-commission/:id` | `rate-commission` L | |
| POST | `/rate-commission` | `rate-commission` T | `{ serviceCode, category, value, type, startDate, endDate?, notes? }` |
| PUT | `/rate-commission/:id` | `rate-commission` E | Partial update; re-validates the one-rate-per-category rule if serviceCode/category changes; records to `rate_commission_histories` |
| GET | `/rate-commission/:id/history` | `rate-commission` L | Change history for one rate: who/when/from/to for value/type/startDate/endDate |
| GET | `/rate-commission/histories` | `rate-commission` L | Global change log across all rate commissions; paginated, `q` searches service name/code or changer name |
| DELETE | `/rate-commission/:id` | `rate-commission` H | |

## Report (`/report`) — role `admin`

Read-only reconciliation reports over existing redemption/point/referral data — no report-specific
tables besides an audit log of downloads. `type` is one of `cash_redemption`,
`product_voucher_redemption`, `referral_point`, `point_balance`; each has its own column set and
query params (see `swagger.yaml` for the full parameter list: date range or snapshot date, date
basis, branchCode/serviceCode filters, status filters, includeSummary, maskSensitive).

Two modeling notes worth knowing before touching this module:
- There is no direct `User → Branch` relation, so a referral user's "Cabang" for reporting purposes
  is derived from the branch of their **most recently referred customer**
  (`User → CustomerServiceReferral → CustomerService → Customer → Branch`). A user with no referrals
  shows as "Tanpa Cabang".
- `point_balance`'s per-date balance is reconstructed from `points.point` issued and
  `redemptions.pointsUsed` used up to the snapshot date — it does **not** account for point expiry
  (`expire-points` job) between the snapshot date and today, since there is no point ledger table.
  This is a documented approximation, not a bug.

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/report/preview?type=` | `report` L | First 20 rows + `totalRows`/`truncated`, for a quick look before downloading |
| GET | `/report/download?type=&format=` | `report` L | Streams the XLSX/CSV file directly (not stored in MinIO — ephemeral, may contain bank/NPWP data); logs to `report_download_histories` |
| GET | `/report/histories` | `report` L | Paginated audit log of past downloads; `q` searches period label or downloader name |

## Role / RBAC (`/role`) — role `admin`

| Method | Path | Permission | Notes |
|--------|------|-----------|-------|
| GET | `/role/permission-matrix` | `role` L | Available modules + actions |
| GET | `/role/employees` | `role` L | Employees for assignment |
| GET | `/role[/:id]` | `role` L | |
| POST | `/role` | `role` T | `{ name, description?, color?, permissions?, employeeIds? }` |
| PUT | `/role/:id` | `role` E | |
| DELETE | `/role/:id` | `role` H | |

## Notification (`/notification`) — role `user`

Referral-partner notifications only (admins get 403). `userId=null` rows are broadcasts;
read state is tracked per-user, so a broadcast's read flag is independent for each user.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/notification` | Paginated (own + broadcasts, newest first); each item has `isRead`/`isBroadcast`. FE uses infinite scroll |
| GET | `/notification/unread-count` | `{ count }` for the bell badge |
| PATCH | `/notification/read-all` | Mark all read → `{ marked }` |
| PATCH | `/notification/:id/read` | Mark one read (idempotent; 404 if not visible to the user) |

Raised automatically on: new points, redemption transferred/shipped/completed/voucher,
account status change (per-user); new article/video/promotion (broadcast).

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
| GET | `/additional/branch` | Bearer | Branch list (`branches` table) → `{ id, code, name }`, read-only reference data |
| GET | `/additional/employee` | Bearer | Active employees → `{ code, name }` (code = `employeeId`), used for the Account Manager filter |
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
