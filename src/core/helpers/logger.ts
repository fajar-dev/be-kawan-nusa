/**
 * Structured JSON logger for Grafana Loki / Promtail.
 *
 * Every entry is a single-line JSON object (NDJSON) written to two sinks:
 *   1. stdout — captured by Docker / PM2 and shipped to Loki by Promtail.
 *   2. a daily-rotated file `logs/app-YYYY-MM-DD.log` — an on-disk history that
 *      survives even if the platform's stdout logs rotate away or are lost.
 *
 * No ANSI colors, no multi-line records; each field below is queryable in Loki:
 *
 *   {"time":"2026-07-18T10:00:00.000Z","level":"info","service":"kawan-nusa-be",
 *    "env":"production","msg":"GET /api/user 200","method":"GET","path":"/api/user",
 *    "status":200,"duration_ms":12}
 *
 * The file sink uses synchronous appends so no line is lost when short-lived jobs
 * call process.exit(). Disable it with LOG_TO_FILE=false (stdout stays on).
 * Old logs/app-*.log files can be pruned by cron/logrotate if disk is a concern.
 */

import { appendFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

export type LogLevel = "info" | "warn" | "error"

const SERVICE = "kawan-nusa-be"
const ENV = process.env.NODE_ENV || "development"
const LOG_DIR = join(process.cwd(), "logs")
const FILE_ENABLED = process.env.LOG_TO_FILE !== "false" && ENV !== "test"

let dirReady = false
function ensureDir(): boolean {
    if (dirReady) return true
    try {
        if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true })
        dirReady = true
    } catch {
        return false
    }
    return true
}

function emit(level: LogLevel, message: string, fields: Record<string, unknown> = {}): void {
    const time = new Date().toISOString()
    const entry: Record<string, unknown> = {
        time,
        level,
        service: SERVICE,
        env: ENV,
        msg: message,
        ...fields,
    }
    // Single physical line — JSON.stringify escapes any newlines (e.g. in stacks).
    const line = JSON.stringify(entry) + "\n"

    // Primary sink: stdout (Docker/PM2 → Promtail → Loki)
    process.stdout.write(line)

    // Secondary sink: on-disk daily-rotated history (never let it break the app)
    if (FILE_ENABLED && ensureDir()) {
        try {
            appendFileSync(join(LOG_DIR, `app-${time.slice(0, 10)}.log`), line)
        } catch {
            // ignore file write errors — stdout already carries the log
        }
    }
}

export const logger = {
    info: (message: string, fields?: Record<string, unknown>) => emit("info", message, fields),
    warn: (message: string, fields?: Record<string, unknown>) => emit("warn", message, fields),
    error: (message: string, fields?: Record<string, unknown>) => emit("error", message, fields),
}

/**
 * Backward-compatible error logger. Now emits one structured JSON line with the
 * stack trace kept as an escaped field so it stays on a single Loki log line.
 */
export function logError(err: Error, context?: { method?: string; path?: string }): void {
    logger.error(err.message, {
        method: context?.method ?? "-",
        path: context?.path ?? "-",
        error: err.name,
        stack: err.stack,
    })
}
