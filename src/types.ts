import type { OperationContracts, Schemas } from './generated/schema.js'

export type { OperationContracts, Schemas }
export type OperationId = keyof OperationContracts
export type ResponseOf<Id extends OperationId> = OperationContracts[Id]['response']
export type QueryOf<Id extends OperationId> = OperationContracts[Id]['query']
export type BodyOf<Id extends OperationId> = OperationContracts[Id]['body']
export type Problem = Schemas['Problem']
export type Lead = Schemas['Lead']
export type LeadDetail = Schemas['LeadDetail']
export type Team = Schemas['Team']
export type Board = Schemas['Board']
export type Member = Schemas['Member']
export type BookingService = Schemas['BookingService']
export type Activity = Schemas['Activity']
export type Call = Schemas['Call']
export type Conversation = Schemas['Conversation']
export type Booking = Schemas['Booking']
export type FeedItem = Schemas['FeedItem']
export type FeedPage = Schemas['FeedPage']

export interface RequestOptions {
  /** Required on collection routes when the key reads more than one team. */
  team?: string
  signal?: AbortSignal
  /** Total deadline, including retries and response body parsing. */
  timeoutMs?: number
}
export type RequestInput<Id extends OperationId> = RequestOptions
  & (keyof OperationContracts[Id]['path'] extends never ? { path?: never } : { path: OperationContracts[Id]['path'] })
  & (keyof QueryOf<Id> extends never ? { query?: never } : { query?: QueryOf<Id> })
  & ([BodyOf<Id>] extends [never] ? { body?: never } : { body: BodyOf<Id> })
export type RequestArgs<Id extends OperationId> = {} extends RequestInput<Id> ? [input?: RequestInput<Id>] : [input: RequestInput<Id>]
export type ListOperationId = { [Id in OperationId]: ResponseOf<Id> extends { data: unknown[]; has_more: boolean; next_cursor: string | null } ? Id : never }[OperationId]
export type ItemOf<Id extends ListOperationId> = ResponseOf<Id> extends { data: Array<infer Item> } ? Item : never
export interface ResponseInfo<T> {
  data: T
  status: number
  requestId: string | null
  headers: Headers
}
export interface ClientOptions {
  apiKey: string
  team?: string
  baseUrl?: string
  timeoutMs?: number
  /** Retries after the first attempt, between 0 and 5. Default 2. */
  maxRetries?: number
  /** Retry-After above this bound is surfaced to the caller, never shortened. Default 30s. */
  maxRetryDelayMs?: number
  fetch?: typeof globalThis.fetch
}
