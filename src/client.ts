import { TotemProtocolError } from './errors.js'
import { Transport, type WireInput } from './transport.js'
import type { BodyOf, ClientOptions, ItemOf, ListOperationId, OperationId, QueryOf, RequestArgs, RequestOptions, ResponseInfo, ResponseOf } from './types.js'

export class TotemClient {
  #transport: Transport
  constructor(options: ClientOptions) { this.#transport = new Transport(options) }

  async request<Id extends OperationId>(operation: Id, ...args: RequestArgs<Id>): Promise<ResponseOf<Id>> {
    return (await this.requestWithResponse(operation, ...args)).data
  }
  requestWithResponse<Id extends OperationId>(operation: Id, ...args: RequestArgs<Id>): Promise<ResponseInfo<ResponseOf<Id>>> {
    return this.#transport.send(operation, args[0] ?? {})
  }

  readonly me = { get: (options: RequestOptions = {}) => this.request('me.get', options) }
  readonly teams = {
    list: (options: RequestOptions = {}) => this.request('teams.list', options),
    get: (id: string, options: RequestOptions = {}) => this.request('teams.get', { ...options, path: { id } }),
  }
  readonly boards = { list: (query: QueryOf<'boards.list'> = {}, options: RequestOptions = {}) => this.request('boards.list', { ...options, query }) }
  readonly members = { list: (options: RequestOptions = {}) => this.request('members.list', options) }
  readonly bookingServices = { list: (options: RequestOptions = {}) => this.request('booking_services.list', options) }
  readonly leads = {
    list: (query: QueryOf<'leads.list'> = {}, options: RequestOptions = {}) => this.request('leads.list', { ...options, query }),
    get: (id: string, options: RequestOptions = {}) => this.request('leads.get', { ...options, path: { id } }),
    search: (body: BodyOf<'leads.search'>, options: RequestOptions = {}) => this.request('leads.search', { ...options, body }),
    activities: (id: string, query: QueryOf<'leads.activities'> = {}, options: RequestOptions = {}) => this.request('leads.activities', { ...options, path: { id }, query }),
  }
  readonly calls = {
    list: (query: QueryOf<'calls.list'> = {}, options: RequestOptions = {}) => this.request('calls.list', { ...options, query }),
    get: (id: string, options: RequestOptions = {}) => this.request('calls.get', { ...options, path: { id } }),
  }
  readonly conversations = {
    list: (query: QueryOf<'conversations.list'> = {}, options: RequestOptions = {}) => this.request('conversations.list', { ...options, query }),
    get: (id: string, options: RequestOptions = {}) => this.request('conversations.get', { ...options, path: { id } }),
  }
  readonly bookings = {
    list: (query: QueryOf<'bookings.list'> = {}, options: RequestOptions = {}) => this.request('bookings.list', { ...options, query }),
    get: (id: string, options: RequestOptions = {}) => this.request('bookings.get', { ...options, path: { id } }),
  }
  readonly sync = { changes: (query: QueryOf<'sync.changes'> = {}, options: RequestOptions = {}) => this.request('sync.changes', { ...options, query }) }
  health(options: RequestOptions = {}) { return this.request('health', options) }

  /** Finite traversal. On sync.changes stop once caught up; persist each page's next_cursor yourself. */
  async *pages<Id extends ListOperationId>(operation: Id, ...args: RequestArgs<Id>): AsyncGenerator<ResponseOf<Id>> {
    const input: WireInput = { ...args[0] }
    const seen = new Set<string>()
    if (input.query && 'cursor' in input.query && typeof input.query.cursor === 'string') seen.add(input.query.cursor)
    for (;;) {
      const response = await this.#transport.send<ResponseOf<Id>>(operation, input)
      const page = response.data as { data: unknown[]; has_more: boolean; next_cursor: string | null }
      if (!page || !Array.isArray(page.data) || typeof page.has_more !== 'boolean') throw new TotemProtocolError('Expected a Totem list page', response.requestId)
      if (page.has_more && (typeof page.next_cursor !== 'string' || !page.next_cursor || seen.has(page.next_cursor))) throw new TotemProtocolError('Pagination returned a missing or repeated cursor', response.requestId)
      yield response.data
      if (!page.has_more) return
      seen.add(page.next_cursor!)
      input.query = { ...input.query, cursor: page.next_cursor }
    }
  }
  async *items<Id extends ListOperationId>(operation: Id, ...args: RequestArgs<Id>): AsyncGenerator<ItemOf<Id>> {
    for await (const page of this.pages(operation, ...args)) {
      for (const item of (page as unknown as { data: ItemOf<Id>[] }).data) yield item
    }
  }
}
