// Circuit breaker + retry with backoff + structured logger for SSW calls

// ── Logger ────────────────────────────────────────────────────────────────────

type LogLevel = "info" | "warn" | "error"

export interface LogEntry {
  ts: string
  level: LogLevel
  endpoint: string
  message: string
  [key: string]: unknown
}

const LOG_BUFFER_MAX = 300
const logBuffer: LogEntry[] = []

export function getLogs(): LogEntry[] {
  return [...logBuffer].reverse()
}

export function clearLogs() {
  logBuffer.length = 0
}

export function sswLog(
  level: LogLevel,
  endpoint: string,
  message: string,
  extra?: Record<string, unknown>
) {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    endpoint,
    message,
    ...extra,
  }

  // ring buffer — descarta o mais antigo quando cheio
  if (logBuffer.length >= LOG_BUFFER_MAX) logBuffer.shift()
  logBuffer.push(entry)

  const line = JSON.stringify({ service: "ssw", ...entry })
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

// ── Circuit Breaker ───────────────────────────────────────────────────────────

type CBState = "CLOSED" | "OPEN" | "HALF_OPEN"

interface CBConfig {
  threshold: number   // failures before opening
  resetMs: number     // ms before trying HALF_OPEN
}

class CircuitBreaker {
  private state: CBState = "CLOSED"
  private failures = 0
  private openedAt = 0
  private readonly cfg: CBConfig

  constructor(private readonly name: string, cfg?: Partial<CBConfig>) {
    this.cfg = { threshold: 5, resetMs: 30_000, ...cfg }
  }

  isOpen(): boolean {
    if (this.state === "OPEN") {
      if (Date.now() - this.openedAt >= this.cfg.resetMs) {
        this.state = "HALF_OPEN"
        sswLog("warn", this.name, "circuit half-open — testing SSW")
        return false
      }
      return true
    }
    return false
  }

  onSuccess() {
    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED"
      this.failures = 0
      sswLog("info", this.name, "circuit closed — SSW recovered")
    } else {
      this.failures = 0
    }
  }

  onFailure() {
    this.failures++
    if (this.failures >= this.cfg.threshold && this.state !== "OPEN") {
      this.state = "OPEN"
      this.openedAt = Date.now()
      sswLog("error", this.name, "circuit opened — SSW unreachable", {
        failures: this.failures,
      })
    }
  }

  getState() { return this.state }
}

// one circuit per protocol
export const restCircuit = new CircuitBreaker("ssw-rest", { threshold: 5, resetMs: 30_000 })
export const soapCircuit = new CircuitBreaker("ssw-soap", { threshold: 3, resetMs: 20_000 })

// ── Retry with exponential backoff ────────────────────────────────────────────

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

interface RetryOptions {
  attempts?: number
  baseMs?: number
  circuit?: CircuitBreaker
}

const SSW_TIMEOUT_MS = 10_000 // 10s — falha rápida se rede bloquear ssw.inf.br

/** Wraps a fetch call adding an AbortController timeout. */
export function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SSW_TIMEOUT_MS)
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  endpoint: string,
  opts: RetryOptions = {}
): Promise<T> {
  const { attempts = 3, baseMs = 200, circuit } = opts

  if (circuit?.isOpen()) {
    throw new Error(`SSW indisponível (circuit open: ${circuit.getState()})`)
  }

  let lastErr: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const t0 = Date.now()
    try {
      const result = await fn()
      circuit?.onSuccess()
      if (attempt > 1) {
        sswLog("info", endpoint, `recuperado na tentativa ${attempt}`, { ms: Date.now() - t0 })
      }
      return result
    } catch (err) {
      lastErr = err
      const ms = Date.now() - t0
      const isAbort = err instanceof Error && err.name === "AbortError"
      const isRetryable =
        isAbort ||
        (err instanceof Error &&
          (err.message.includes("fetch failed") ||
            err.message.includes("ECONNRESET") ||
            err.message.includes("ETIMEDOUT") ||
            RETRYABLE_STATUS.has(parseInt(err.message.match(/HTTP (\d+)/)?.[1] ?? "0"))))

      if (isAbort) {
        sswLog("error", endpoint, `timeout após ${SSW_TIMEOUT_MS}ms — ssw.inf.br inacessível`, { attempt, ms })
      } else {
        sswLog(attempt < attempts && isRetryable ? "warn" : "error", endpoint, err instanceof Error ? err.message : String(err), {
          attempt,
          ms,
          retrying: attempt < attempts && isRetryable,
        })
      }

      if (!isRetryable || attempt === attempts) {
        circuit?.onFailure()
        break
      }

      await sleep(baseMs * 2 ** (attempt - 1))
    }
  }

  throw lastErr
}
