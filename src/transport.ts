import { TotemApiError, TotemProtocolError, TotemTimeoutError } from './errors.js'
import { DEFAULT_BASE_URL, operationDefinitions } from './generated/operations.js'
import type { ClientOptions, OperationId, Problem, RequestOptions, ResponseInfo } from './types.js'

export interface WireInput extends RequestOptions {
  path?: Record<string, string>
  query?: Record<string, unknown>
  body?: unknown
}
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504])

function boundedNumber(value: number, name: string, min: number, max: number): number {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new TypeError(`${name} must be an integer between ${min} and ${max}`)
  return value
}
function retryAfter(value: string | null): number | null {
  if (value === null) return null
  if (/^\d+$/.test(value)) return Number(value) * 1000
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}
function problemOf(value: unknown): Problem | null {
  if (!value || typeof value !== 'object') return null
  const problem = value as Record<string, unknown>
  return typeof problem.code === 'string' && /^[a-z0-9_]+$/.test(problem.code)
    && typeof problem.status === 'number' && typeof problem.title === 'string'
    && typeof problem.request_id === 'string' && typeof problem.type === 'string'
    && typeof problem.doc_url === 'string' ? value as Problem : null
}
function pause(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
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
    if (typeof window !== 'undefined' || typeof document !== 'undefined') throw new TypeError('Totem secret keys may only be used on a server')
    if (typeof options.apiKey !== 'string' || !options.apiKey.trim() || /[\r\n]/.test(options.apiKey)) throw new TypeError('apiKey must be a nonempty secret without line breaks')
    this.#apiKey = options.apiKey
    this.#baseUrl = new URL(options.baseUrl ?? DEFAULT_BASE_URL)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(this.#baseUrl.hostname)
    if ((this.#baseUrl.protocol !== 'https:' && !(this.#baseUrl.protocol === 'http:' && loopback))
      || this.#baseUrl.username || this.#baseUrl.password || this.#baseUrl.search || this.#baseUrl.hash) throw new TypeError('baseUrl must be HTTPS (HTTP is allowed only on loopback), with no credentials, query or fragment')
    this.#baseUrl.pathname = this.#baseUrl.pathname.replace(/\/+$/, '') + '/'
    this.#team = options.team
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
      if (value !== undefined) {
        if (typeof value !== 'string' && typeof value !== 'number') throw new TypeError(`Invalid query parameter ${name}`)
        url.searchParams.set(name, String(value))
      }
    }
    const headers = new Headers({ Accept: 'application/json', 'User-Agent': '@totemstudio/sdk/0.1.0-beta.1' })
    if (definition.authenticated) headers.set('Authorization', `Bearer ${this.#apiKey}`)
    const team = input.team ?? this.#team
    if (definition.team && team !== undefined) headers.set('Totem-Team', team)
    const body = input.body === undefined ? undefined : JSON.stringify(input.body)
    if (body !== undefined) headers.set('Content-Type', 'application/json')
    const timeoutMs = boundedNumber(input.timeoutMs ?? this.#timeoutMs, 'timeoutMs', 1, 2_147_483_647)
    const deadline = new AbortController()
    const timer = setTimeout(() => deadline.abort(new TotemTimeoutError(timeoutMs)), timeoutMs)
    const signal = input.signal ? AbortSignal.any([input.signal, deadline.signal]) : deadline.signal
    try {
      for (let attempt = 0; ; attempt++) {
        signal.throwIfAborted()
        let response: Response
        try {
          response = await this.#fetch(url, { method: definition.method, headers, ...(body === undefined ? {} : { body }), signal, redirect: 'manual' })
        } catch (error) {
          signal.throwIfAborted()
          if (!(error instanceof TypeError) || attempt >= this.#maxRetries) throw error
          const delay = 250 * 2 ** attempt
          if (delay > this.#maxRetryDelayMs) throw error
          await pause(delay, signal)
          continue
        }
        const requestId = response.headers.get('Totem-Request-Id')
        const delay = retryAfter(response.headers.get('Retry-After'))
        if (!response.ok) {
          let value: unknown = null
          try { value = await response.json() } catch { signal.throwIfAborted() }
          const error = new TotemApiError(response.status, problemOf(value), requestId, delay)
          if (RETRYABLE.has(response.status) && attempt < this.#maxRetries) {
            const wait = delay ?? 250 * 2 ** attempt
            if (wait <= this.#maxRetryDelayMs) { await pause(wait, signal); continue }
          }
          throw error
        }
        let value: T
        try { value = await response.json() as T } catch {
          signal.throwIfAborted()
          throw new TotemProtocolError('Totem API returned invalid JSON', requestId)
        }
        return { data: value, status: response.status, requestId, headers: response.headers }
      }
    } finally { clearTimeout(timer) }
  }
}
