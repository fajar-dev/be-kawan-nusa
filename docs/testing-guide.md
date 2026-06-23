# Testing Guide

This project uses **Bun Test** for integration testing.

## Commands

```bash
bun test                          # Run all tests
bun test tests/integration/auth   # Run specific module
bun test --watch                  # Watch mode
```

## Configuration

`bunfig.toml` preloads `tests/setup.ts` which initializes the database connection before tests run.

## Test Helpers

### test-client.ts

```typescript
import { request, authRequest } from "../helpers/test-client"

// Unauthenticated request
const res = await request("/auth/login", {
    method: "POST",
    body: { identifier: "test@example.com", password: "password123" },
})
// res = { status: 200, body: { success: true, data: {...} }, headers: Headers }

// Authenticated request
const res = await authRequest("/profile", token)
const res = await authRequest("/profile/account", token, { method: "PUT", body: {...} })
```

### auth.helper.ts

```typescript
import {
    createTestUser, createTestAdmin,
    generateUserToken, generateAdminToken,
    cleanupTestUser, cleanupTestAdmin
} from "../helpers/auth.helper"

const testUser = await createTestUser()               // password: "password123"
const testUser = await createTestUser({ email: "custom@test.com" })
const testAdmin = await createTestAdmin()
const userToken = await generateUserToken(testUser)    // role: "user"
const adminToken = await generateAdminToken(testAdmin) // role: "admin"
await cleanupTestUser(testUser.id)
await cleanupTestAdmin(testAdmin.id)
```

## Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test"
import { request, authRequest } from "../helpers/test-client"
import { createTestUser, createTestAdmin, generateUserToken, generateAdminToken, cleanupTestUser, cleanupTestAdmin } from "../helpers/auth.helper"
import { User } from "../../src/modules/user/entities/user.entity"
import { Employee } from "../../src/modules/employee/entities/employee.entity"

describe("Invoice Module", () => {
    let testUser: User
    let testAdmin: Employee
    let userToken: string
    let adminToken: string

    beforeAll(async () => {
        testUser = await createTestUser()
        testAdmin = await createTestAdmin()
        userToken = await generateUserToken(testUser)
        adminToken = await generateAdminToken(testAdmin)
    })

    afterAll(async () => {
        if (testUser?.id) await cleanupTestUser(testUser.id)
        if (testAdmin?.id) await cleanupTestAdmin(testAdmin.id)
    })

    describe("GET /invoice", () => {
        it("should return invoice list", async () => {
            const res = await authRequest("/invoice", userToken)
            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(Array.isArray(res.body.data)).toBe(true)
        })

        it("should support pagination", async () => {
            const res = await authRequest("/invoice?page=1&limit=5", userToken)
            expect(res.status).toBe(200)
            expect(res.body.meta).toBeDefined()
        })

        it("should fail without auth", async () => {
            const res = await request("/invoice")
            expect(res.status).toBe(401)
        })

        it("should fail for wrong role", async () => {
            const res = await authRequest("/invoice", adminToken)
            expect(res.status).toBe(403)
        })
    })

    describe("GET /invoice/:id", () => {
        it("should return 404 for non-existent", async () => {
            const res = await authRequest("/invoice/999999", userToken)
            expect(res.status).toBe(404)
        })
    })

    describe("POST /invoice", () => {
        it("should fail with missing required fields", async () => {
            const res = await authRequest("/invoice", userToken, {
                method: "POST",
                body: {},
            })
            expect(res.status).toBe(422)
        })
    })
})
```

## What to Test per Endpoint

| Category | Test Cases |
|----------|------------|
| **Happy path** | Valid request returns correct data |
| **Pagination** | `?page=1&limit=5` returns meta |
| **Filters** | `?search=`, `?type=`, `?status=` work |
| **Auth** | No token → 401 |
| **Role** | Wrong role → 403 |
| **Validation** | Missing/invalid fields → 422 |
| **Not found** | Non-existent ID → 404 |
| **Edge cases** | Empty body, boundary values |

## Status Code Reference

| Code | When |
|------|------|
| 200 | Success |
| 201 | Created |
| 400 | Business rule violation |
| 401 | Missing/invalid token |
| 403 | Wrong role |
| 404 | Not found |
| 422 | Zod validation error |
| 500 | Internal server error |
