# Swagger / OpenAPI Documentation Guide

Swagger docs are in `swagger.yaml` at the project root, accessible at `/api/docs`.

## Adding a New Endpoint

### Step 1: Define Schemas

```yaml
components:
  schemas:
    CreateInvoiceRequest:
      type: object
      required: [title, amount]
      properties:
        title:
          type: string
          minLength: 1
          example: "Internet Service - June"
        amount:
          type: number
          minimum: 0
          example: 250000

    InvoiceResponse:
      type: object
      properties:
        id: { type: integer, example: 1 }
        title: { type: string, example: "Internet Service" }
        amount: { type: number, example: 250000 }
        status: { type: string, enum: [pending, paid, cancelled] }
        createdAt: { type: string, format: date-time }
```

### Step 2: Define Paths

```yaml
paths:
  /invoice:
    get:
      summary: List invoices
      tags: [Invoice]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 10 }
      responses:
        200:
          description: Invoice list
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/BaseResponse'
                  - properties:
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/InvoiceResponse'
                      meta:
                        $ref: '#/components/schemas/PaginationMeta'
        401:
          description: Unauthorized

    post:
      summary: Create invoice
      tags: [Invoice]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateInvoiceRequest'
      responses:
        201:
          description: Invoice created
        422:
          description: Validation error

  /invoice/{id}:
    get:
      summary: Get invoice detail
      tags: [Invoice]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        200:
          description: Invoice detail
        404:
          description: Not found

    put:
      summary: Update invoice
      tags: [Invoice]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateInvoiceRequest'
      responses:
        200:
          description: Invoice updated
        404:
          description: Not found

    delete:
      summary: Delete invoice
      tags: [Invoice]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        200:
          description: Invoice deleted
        404:
          description: Not found
```

## Conventions

| Rule | Example |
|------|---------|
| Tags match module name | `[Invoice]`, `[Auth]`, `[Reward]` |
| Use `$ref` for reusable schemas | `$ref: '#/components/schemas/...'` |
| Always include `security` | `- bearerAuth: []` |
| Document all status codes | 200, 201, 400, 401, 403, 404, 422 |
| Include `example` values | Realistic data |
| Use `allOf` for wrapped responses | `BaseResponse` + specific data |

## Reusable Schemas

- `BaseResponse` — `{ success, statusCode, message }`
- `PaginationMeta` — `{ page, limit, total, lastPage }`
- `ErrorResponse` — `{ success: false, message }`

## Testing Swagger

1. Start server: `bun run dev`
2. Open: `http://localhost:8000/api/docs`
3. Use "Try it out" to test endpoints
