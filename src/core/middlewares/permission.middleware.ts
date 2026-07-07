import { Context, Next } from "hono"
import { ForbiddenException } from "../exceptions/base"

export const permissionMiddleware = (module: string, action: "L" | "T" | "E" | "H") => {
    return async (c: Context, next: Next) => {
        const permissions = c.get("permissions") as Record<string, string[]> | undefined
        if (!permissions || !permissions[module]?.includes(action)) {
            throw new ForbiddenException("Insufficient permissions")
        }

        await next()
    }
}
