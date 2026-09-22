import { Context, Next } from "hono"
import { ForbiddenException } from "../exceptions/base"

export const permissionMiddleware = (module: string, action: "L" | "T" | "E" | "H") => {
    return async (c: Context, next: Next) => {
        // Already authenticated by apiKeyAdminMiddleware upstream — super admin, skip check.
        if (c.get("isApiKeyAuth")) {
            await next()
            return
        }

        const permissions = c.get("permissions") as Record<string, string[]> | undefined
        if (!permissions || !permissions[module]?.includes(action)) {
            throw new ForbiddenException("Insufficient permissions")
        }

        await next()
    }
}
