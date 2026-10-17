import { errorCatalogue } from './generated/operations.js'
import type { ErrorAction, Problem, TotemErrorCode } from './types.js'

/** Base class of every error the SDK raises itself. A caller's own abort reason is rethrown unchanged instead. */
export class TotemError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TotemError'
  }
}

/** A parameter, header or field name the server reported; never a value. */
const PARAM_NAME = /^[A-Za-z0-9_.-]{1,64}$/

/**
 * A non-success HTTP response. Branch on `action` (or `code`), and quote
 * `requestId` to support. The message names the status, code and parameter
 * only: it never carries a value, `problem` text or a response body.
 */
export class TotemApiError extends TotemError {
  readonly status: number
  /** The problem's `code`, or `http_error` when the response had no problem document. New codes may appear. */
  readonly code: TotemErrorCode | (string & {})
  /** What to do, from the contract's error catalogue; null for an unknown code or a response with no problem document. */
  readonly action: ErrorAction | null
  /** The parameter, header or body field at fault, when the server names one. */
  readonly param: string | null
  /** The problem's short English summary. It can change: branch on `code` or `action`. */
  readonly title: string | null
  readonly requestId: string | null
  /** The server's Retry-After delay in milliseconds, when it sent one. */
  readonly retryAfterMs: number | null
  /** The RFC 9457 document, or null for a firewall or other non-problem response. */
  readonly problem: Problem | null

  constructor(status: number, problem: Problem | null, requestId: string | null, retryAfterMs: number | null) {
    const code = problem?.code ?? 'http_error'
    const param = problem?.param ?? null
    super(`Totem API request failed (${status}, ${code}${param !== null && PARAM_NAME.test(param) ? `, param=${param}` : ''})`)
    this.name = 'TotemApiError'
    this.status = status
    this.code = code
    this.action = Object.hasOwn(errorCatalogue, code) ? errorCatalogue[code as TotemErrorCode].action : null
    this.param = param
    this.title = problem?.title ?? null
    this.requestId = requestId ?? problem?.request_id ?? null
    this.retryAfterMs = retryAfterMs
    this.problem = problem
  }
}

/** The API answered in a way the contract does not allow: invalid JSON, or a list page with no progress. */
export class TotemProtocolError extends TotemError {
  readonly requestId: string | null
  constructor(message: string, requestId: string | null = null, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TotemProtocolError'
    this.requestId = requestId
  }
}

/** The request's own `timeoutMs` deadline passed, including retries and body reading. */
export class TotemTimeoutError extends TotemError {
  readonly timeoutMs: number
  constructor(timeoutMs: number) {
    super(`Totem API request exceeded its ${timeoutMs}ms deadline`)
    this.name = 'TotemTimeoutError'
    this.timeoutMs = timeoutMs
  }
}

/** The network failed (before or during the response) and the retry budget or the deadline ran out. `cause` holds the last failure. */
export class TotemConnectionError extends TotemError {
  constructor(cause: unknown) {
    super('Totem API connection failed', { cause })
    this.name = 'TotemConnectionError'
  }
}
