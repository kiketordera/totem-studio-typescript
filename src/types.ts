import type { Board, FeedItem, OperationContracts } from './generated/schema.js'
import type { errorCatalogue, operationDefinitions } from './generated/operations.js'

/** Every component schema as a named type (`Lead`, `LeadDetail`, `FeedItem`, …), `Schemas`, `TotemErrorCode` and `ErrorAction`. */
export type * from './generated/schema.js'
export type OperationId = keyof OperationContracts
export type ResponseOf<Id extends OperationId> = OperationContracts[Id]['response']
export type QueryOf<Id extends OperationId> = OperationContracts[Id]['query']
export type BodyOf<Id extends OperationId> = OperationContracts[Id]['body']
/** One catalogue entry: `{ status, action, docUrl }`. */
export type ErrorCatalogueEntry = (typeof errorCatalogue)[keyof typeof errorCatalogue]

/** One stage of a board. */
export type Stage = Board['stages'][number]
/** A changes-feed item that removes a record: delete your copy and keep its version. */
export type FeedRemoval = Extract<FeedItem, { removed: object }>
/** A changes-feed item that carries a record's current state. */
export type FeedUpsert = Exclude<FeedItem, FeedRemoval>
/** The record type a feed upsert of kind `K` carries, e.g. `FeedObjectOf<'lead'>` is `Lead`. */
export type FeedObjectOf<K extends FeedUpsert['kind']> = Extract<FeedUpsert, { kind: K }>['object']

export interface RequestOptions {
  /**
   * The team to read, as a `team_…` id. Required on collection routes when the
   * key reads more than one team. Detail routes take the team from the
   * record's id: compare the record's `team` with the one you expect.
   */
  team?: string | undefined
  /** Cancels the request; the signal's own reason is rethrown unchanged. Shared across pages, it also bounds a whole traversal. */
  signal?: AbortSignal | undefined
  /** Deadline of one request, including retries, retry waits and body reading. In `pages()` and `items()` it applies to each page. */
  timeoutMs?: number | undefined
}
/** Request settings of one operation: `team` only where the API reads a `Totem-Team` header. */
export type OptionsOf<Id extends OperationId> = (typeof operationDefinitions)[Id]['team'] extends true ? RequestOptions : Omit<RequestOptions, 'team'>
export type RequestInput<Id extends OperationId> = OptionsOf<Id>
  & (keyof OperationContracts[Id]['path'] extends never ? { path?: never } : { path: OperationContracts[Id]['path'] })
  & (keyof QueryOf<Id> extends never ? { query?: never } : { query?: QueryOf<Id> | undefined })
  & ([BodyOf<Id>] extends [never] ? { body?: never } : { body: BodyOf<Id> })
export type RequestArgs<Id extends OperationId> = {} extends RequestInput<Id> ? [input?: RequestInput<Id>] : [input: RequestInput<Id>]
export type ListOperationId = { [Id in OperationId]: ResponseOf<Id> extends { data: unknown[]; has_more: boolean; next_cursor: string | null } ? Id : never }[OperationId]
/**
 * Lists `items()` can traverse. A feed whose every page carries a cursor to
 * save (`sync.changes`) is excluded: use `pages()` and checkpoint each page.
 */
export type ItemsOperationId = { [Id in ListOperationId]: ResponseOf<Id>['next_cursor'] extends string ? never : Id }[ListOperationId]
export type ItemOf<Id extends ListOperationId> = ResponseOf<Id> extends { data: Array<infer Item> } ? Item : never
export interface ResponseInfo<T> {
  data: T
  status: number
  requestId: string | null
  headers: Headers
}
export interface ClientOptions {
  apiKey: string
  /** Default team for collection routes; see `RequestOptions.team`. */
  team?: string | undefined
  /** Defaults to `https://api.totemstudio.ai/v1`. HTTPS only, except on loopback. */
  baseUrl?: string | undefined
  /** Default deadline of one request, in milliseconds. Default 30 s. */
  timeoutMs?: number | undefined
  /** Retries after the first attempt, between 0 and 5. Default 2. */
  maxRetries?: number | undefined
  /** Longest server Retry-After the SDK waits out; a longer one is returned to the caller, never shortened. Default 30 s. */
  maxRetryDelayMs?: number | undefined
  /** A trusted fetch implementation: it receives the secret key. */
  fetch?: typeof globalThis.fetch | undefined
}
