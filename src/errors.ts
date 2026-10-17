import type { Problem } from './types.js'

/** A non-success HTTP response. Branch on code/status, and quote requestId to support. */
export class TotemApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string | null
  readonly retryAfterMs: number | null
  readonly problem: Problem | null

  constructor(status: number, problem: Problem | null, requestId: string | null, retryAfterMs: number | null) {
    const code = problem?.code ?? 'http_error'
    super(`Totem API request failed (${status}, ${code})`)
    this.name = 'TotemApiError'
    this.status = status
    this.code = code
    this.requestId = requestId ?? problem?.request_id ?? null
    this.retryAfterMs = retryAfterMs
    this.problem = problem
  }
}

export class TotemProtocolError extends Error {
  constructor(message: string, readonly requestId: string | null = null) {
    super(message)
    this.name = 'TotemProtocolError'
  }
}

export class TotemTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Totem API request exceeded its ${timeoutMs}ms deadline`)
    this.name = 'TotemTimeoutError'
  }
}
