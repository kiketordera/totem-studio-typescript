import { TotemApiError, TotemConnectionError, TotemProtocolError, TotemTimeoutError } from './errors.js'
import { DEFAULT_BASE_URL, SDK_VERSION, operationDefinitions } from './generated/operations.js'
import type { ClientOptions, OperationId, Problem, RequestOptions, ResponseInfo } from './types.js'

export interface WireInput extends RequestOptions {
  path?: Record<string, string> | undefined
  query?: Record<string, unknown> | undefined
  body?: unknown
}
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])
/** RFC 9110 IMF-fixdate, the only HTTP-date form a server may send. */
const IMF_FIXDATE = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/

function boundedNumber(value: number, name: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`${name} must be an integer between ${min} and ${max}`)
  return value
}
function teamId(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('team must be a nonempty team id')
  return value
}
/** Delta-seconds or an IMF-fixdate (a past date means 0); anything else is ignored so the SDK's own backoff applies. */
function retryAfter(value: string | null): number | null {
  if (value === null) return null
  if (/^\s*\d+\s*$/.test(value)) {
    const ms = Number(value) * 1000
    return Number.isFinite(ms) ? ms : null
  }
  if (!IMF_FIXDATE.test(value)) return null
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}
/** Equal jitter: half the exponential step, plus a random part of the other half. */
function backoff(attempt: number): number {
  const base = 250 * 2 ** attempt
  return base / 2 + Math.random() * (base / 2)
}
function problemOf(text: string | null): Problem | null {
  let value: unknown
  try { value = text === null ? null : JSON.parse(text) } catch { return null }
  if (!value || typeof value !== 'object') return null
  const problem = value as Record<string, unknown>
  return typeof problem.code === 'string' && /^[a-z0-9_]+$/.test(problem.code)
    && typeof problem.status === 'number' && typeof problem.title === 'string'
    && typeof problem.request_id === 'string' && typeof problem.type === 'string'
    && typeof problem.doc_url === 'string' && (problem.param === undefined || typeof problem.param === 'string') ? value as Problem : null
}
/**
 * Settles with the promise, or rejects with the signal's reason as soon as it aborts, even if the promise ignores the signal.
 * A plain value is accepted too: a JavaScript custom fetch may return its Response synchronously.
 */
function abortable<T>(promise: T | PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    if (signal.aborted) return abort()
    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve(promise).then(
      value => { signal.removeEventListener('abort', abort); resolve(value) },
      (error: unknown) => { signal.removeEventListener('abort', abort); reject(error) },
    )
  })
}
function pause(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}
/**
 * Browsers and browser workers, but not server edge runtimes: workerd and
 * similar define WorkerGlobalScope (and ServiceWorkerGlobalScope) too.
 */
function inBrowser(): boolean {
  const scope = globalThis as Record<string, unknown>
  const isObject = (value: unknown) => typeof value === 'object' && value !== null
  return scope.window !== undefined || scope.document !== undefined
    || typeof scope.importScripts === 'function'
    || scope.DedicatedWorkerGlobalScope !== undefined || scope.SharedWorkerGlobalScope !== undefined
    || (scope.ServiceWorkerGlobalScope !== undefined && isObject(scope.registration) && isObject(scope.clients))
}

/** Keeps credentials private and sends them only to the configured API origin and base path. */
export class Transport {
  #apiKey: string
  #baseUrl: URL
  #team: string | undefined
  #fetch: typeof globalThis.fetch
  #timeoutMs: number
  #maxRetries: number
  #maxRetryDelayMs: number

  constructor(options: ClientOptions) {
    if (inBrowser()) throw new TypeError('Totem secret keys may only be used on a server')
    if (typeof options.apiKey !== 'string' || !options.apiKey.trim() || /[\r\n]/.test(options.apiKey)) throw new TypeError('apiKey must be a nonempty secret without line breaks')
    this.#apiKey = options.apiKey
    this.#baseUrl = new URL(options.baseUrl ?? DEFAULT_BASE_URL)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(this.#baseUrl.hostname)
    if ((this.#baseUrl.protocol !== 'https:' && !(this.#baseUrl.protocol === 'http:' && loopback))
      || this.#baseUrl.username || this.#baseUrl.password || this.#baseUrl.search || this.#baseUrl.hash) throw new TypeError('baseUrl must be HTTPS (HTTP is allowed only on loopback), with no credentials, query or fragment')
    this.#baseUrl.pathname = this.#baseUrl.pathname.replace(/\/+$/, '') + '/'
    if (this.#baseUrl.hostname === new URL(DEFAULT_BASE_URL).hostname && this.#baseUrl.pathname !== '/v1/') throw new TypeError('baseUrl for api.totemstudio.ai must be https://api.totemstudio.ai/v1')
    this.#team = teamId(options.team)
    this.#fetch = options.fetch ?? globalThis.fetch
    if (typeof this.#fetch !== 'function') throw new TypeError('fetch must be a function')
    this.#timeoutMs = boundedNumber(options.timeoutMs ?? 30_000, 'timeoutMs', 1, 2_147_483_647)
    this.#maxRetries = boundedNumber(options.maxRetries ?? 2, 'maxRetries', 0, 5)
    this.#maxRetryDelayMs = boundedNumber(options.maxRetryDelayMs ?? 30_000, 'maxRetryDelayMs', 0, 2_147_483_647)
  }

  async send<T>(operationId: OperationId, input: WireInput): Promise<ResponseInfo<T>> {
    if (!Object.hasOwn(operationDefinitions, operationId)) throw new TypeError('Unknown Totem API operation')
    const definition = operationDefinitions[operationId]
    if (input.body !== undefined && !definition.body) throw new TypeError('This operation does not accept a request body')
    const path = definition.path.replace(/\{([^}]+)\}/g, (_, name: string) => {
      const value = input.path?.[name]
      if (typeof value !== 'string' || !value || value === '.' || value === '..') throw new TypeError(`A resource id is required for ${name}`)
      return encodeURIComponent(value)
    })
    const url = new URL(path.slice(1), this.#baseUrl)
    for (const [name, value] of Object.entries(input.query ?? {})) {
      if (!(definition.query as readonly string[]).includes(name)) throw new TypeError(`Unsupported query parameter ${name}`)
      if (value === undefined || value === null) continue
      if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Invalid query parameter ${name}`)
      url.searchParams.set(name, String(value))
    }
    if (input.signal !== undefined && !(input.signal instanceof AbortSignal)) throw new TypeError('signal must be an AbortSignal')
    const headers = new Headers({ Accept: 'application/json', 'User-Agent': `@totemstudioai/sdk/${SDK_VERSION}` })
    if (definition.authenticated) headers.set('Authorization', `Bearer ${this.#apiKey}`)
    const team = teamId(input.team ?? undefined) ?? this.#team
    if (definition.team && team !== undefined) headers.set('Totem-Team', team)
    const body = input.body === undefined ? undefined : JSON.stringify(input.body)
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    const timeoutMs = boundedNumber(input.timeoutMs ?? this.#timeoutMs, 'timeoutMs', 1, 2_147_483_647)
    // Called unbound: workerd's fetch throws "Illegal invocation" when `this` is another object.
    const fetch = this.#fetch

    const deadline = new AbortController()
    const signal = input.signal ? AbortSignal.any([input.signal, deadline.signal]) : deadline.signal
    const deadlineAt = Date.now() + timeoutMs
    const timer = setTimeout(() => deadline.abort(new TotemTimeoutError(timeoutMs)), timeoutMs)
    /** Waits before the next attempt, or throws `error` when the attempts or the deadline cannot cover the wait. */
    const retry = async (attempt: number, wait: number, error: Error) => {
      if (attempt >= this.#maxRetries || wait >= deadlineAt - Date.now()) throw error
      await pause(wait, signal)
    }
    try {
      for (let attempt = 0; ; attempt++) {
        signal.throwIfAborted()
        let response: Response
        let text: string | null = null
        try {
          const received = await abortable(fetch(url, { method: definition.method, headers, ...(body === undefined ? {} : { body }), signal, redirect: 'manual' }), signal)
          response = received
          // A success body cut off mid-stream is a network failure, not a protocol one.
          // An error response keeps its status even when its body is lost.
          text = await abortable(received.text(), signal).catch((error: unknown) => {
            if (signal.aborted || received.ok || !(error instanceof TypeError)) throw error
            return null
          })
        } catch (error) {
          signal.throwIfAborted()
          if (!(error instanceof TypeError)) throw error
          await retry(attempt, backoff(attempt), new TotemConnectionError(error))
          continue
        }
        const requestId = response.headers.get('Totem-Request-Id')
        if (!response.ok) {
          const delay = retryAfter(response.headers.get('Retry-After'))
          const error = new TotemApiError(response.status, problemOf(text), requestId, delay)
          // maxRetryDelayMs bounds only the server's Retry-After; the SDK's own backoff is bounded by maxRetries and the deadline.
          if (!RETRYABLE.has(response.status) || (delay !== null && delay > this.#maxRetryDelayMs)) throw error
          await retry(attempt, delay ?? backoff(attempt), error)
          continue
        }
        try {
          return { data: JSON.parse(text ?? '') as T, status: response.status, requestId, headers: response.headers }
        } catch (cause) {
          throw new TotemProtocolError('Totem API returned invalid JSON', requestId, { cause })
        }
      }
    } finally { clearTimeout(timer) }
  }
}
