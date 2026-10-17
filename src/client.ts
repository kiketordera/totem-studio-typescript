import { TotemProtocolError } from './errors.js'
import { Transport, type WireInput } from './transport.js'
import type {
  ActivityList, BodyOf, Booking, BookingList, Call, CallList, ClientOptions, Conversation, ConversationList, FeedPage, Health, ItemOf, ItemsOperationId,
  LeadDetail, LeadList, ListOperationId, Me, OperationId, OptionsOf, QueryOf, RequestArgs, ResponseInfo, ResponseOf, BoardList, Team,
} from './types.js'

/** Server-side client for the read-only Totem API. Every method returns the documented JSON body; errors are `TotemError` subclasses. */
export class TotemClient {
  #transport: Transport
  constructor(options: ClientOptions) { this.#transport = new Transport(options) }

  /** Calls any operation by id, typed from the contract. */
  async request<Id extends OperationId>(operation: Id, ...args: RequestArgs<Id>): Promise<ResponseOf<Id>> {
    return (await this.requestWithResponse(operation, ...args)).data
  }
  /** Like `request`, with the HTTP status, request id and headers. */
  requestWithResponse<Id extends OperationId>(operation: Id, ...args: RequestArgs<Id>): Promise<ResponseInfo<ResponseOf<Id>>> {
    return this.#transport.send(operation, args[0] ?? {})
  }

  readonly me = {
    /** The integration this key belongs to. `GET /me` */
    get: (options: OptionsOf<'me.get'> = {}): Promise<Me> => this.request('me.get', options),
  }
  readonly teams = {
    /** Every team this key reads, restricted ones included. `GET /teams` */
    list: (options: OptionsOf<'teams.list'> = {}): Promise<ResponseOf<'teams.list'>> => this.request('teams.list', options),
    /** One team. `GET /teams/{id}` */
    get: (id: string, options: OptionsOf<'teams.get'> = {}): Promise<Team> => this.request('teams.get', { ...options, path: { id } }),
  }
  readonly boards = {
    /** A page of the team's boards with their stages. `GET /boards` */
    list: (query: QueryOf<'boards.list'> = {}, options: OptionsOf<'boards.list'> = {}): Promise<BoardList> => this.request('boards.list', { ...options, query }),
  }
  readonly members = {
    /** Every member of the team, never paged. `GET /members` */
    list: (options: OptionsOf<'members.list'> = {}): Promise<ResponseOf<'members.list'>> => this.request('members.list', options),
  }
  readonly bookingServices = {
    /** Every bookable service of the team, never paged. `GET /booking_services` */
    list: (options: OptionsOf<'booking_services.list'> = {}): Promise<ResponseOf<'booking_services.list'>> => this.request('booking_services.list', options),
  }
  readonly leads = {
    /** A page of the team's leads and clients; filter by at most one of `board`, `stage` and `status`. `GET /leads` */
    list: (query: QueryOf<'leads.list'> = {}, options: OptionsOf<'leads.list'> = {}): Promise<LeadList> => this.request('leads.list', { ...options, query }),
    /** One lead with its attribution and response facets. `GET /leads/{id}` */
    get: (id: string, options: OptionsOf<'leads.get'> = {}): Promise<LeadDetail> => this.request('leads.get', { ...options, path: { id } }),
    /** Leads matching exactly one `email` or `phone`, at most 10, never paged. `POST /leads/search` */
    search: (body: BodyOf<'leads.search'>, options: OptionsOf<'leads.search'> = {}): Promise<ResponseOf<'leads.search'>> => this.request('leads.search', { ...options, body }),
    /** A page of one lead's status, stage and assignee changes. `GET /leads/{id}/activities` */
    activities: (id: string, query: QueryOf<'leads.activities'> = {}, options: OptionsOf<'leads.activities'> = {}): Promise<ActivityList> => this.request('leads.activities', { ...options, path: { id }, query }),
  }
  readonly calls = {
    /** A page of the team's calls. `GET /calls` */
    list: (query: QueryOf<'calls.list'> = {}, options: OptionsOf<'calls.list'> = {}): Promise<CallList> => this.request('calls.list', { ...options, query }),
    /** One call. `GET /calls/{id}` */
    get: (id: string, options: OptionsOf<'calls.get'> = {}): Promise<Call> => this.request('calls.get', { ...options, path: { id } }),
  }
  readonly conversations = {
    /** A page of the team's conversations. `GET /conversations` */
    list: (query: QueryOf<'conversations.list'> = {}, options: OptionsOf<'conversations.list'> = {}): Promise<ConversationList> => this.request('conversations.list', { ...options, query }),
    /** One conversation. `GET /conversations/{id}` */
    get: (id: string, options: OptionsOf<'conversations.get'> = {}): Promise<Conversation> => this.request('conversations.get', { ...options, path: { id } }),
  }
  readonly bookings = {
    /** A page of the team's bookings. `GET /bookings` */
    list: (query: QueryOf<'bookings.list'> = {}, options: OptionsOf<'bookings.list'> = {}): Promise<BookingList> => this.request('bookings.list', { ...options, query }),
    /** One booking. `GET /bookings/{id}` */
    get: (id: string, options: OptionsOf<'bookings.get'> = {}): Promise<Booking> => this.request('bookings.get', { ...options, path: { id } }),
  }
  readonly sync = {
    /** The next page of one team's changes feed. Save its `next_cursor` after applying it, even when the page is empty. `GET /sync/changes` */
    changes: (query: QueryOf<'sync.changes'> = {}, options: OptionsOf<'sync.changes'> = {}): Promise<FeedPage> => this.request('sync.changes', { ...options, query }),
  }
  /** Whether the API is up; needs no key. `GET /health` */
  health(options: OptionsOf<'health'> = {}): Promise<Health> { return this.request('health', options) }

  /**
   * Yields each page until `has_more` is false. On `sync.changes` it stops
   * once caught up; persist each page's `next_cursor` yourself. `timeoutMs`
   * applies to each page; pass `signal: AbortSignal.timeout(ms)` to bound the
   * whole traversal. A missing or repeated cursor raises TotemProtocolError.
   */
  async *pages<Id extends ListOperationId>(operation: Id, ...args: RequestArgs<Id>): AsyncGenerator<ResponseOf<Id>> {
    const input: WireInput = { ...args[0] }
    const seen = new Set<string>()
    if (input.query && typeof input.query.cursor === 'string') seen.add(input.query.cursor)
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
  /**
   * Yields each item of every page. Not offered for `sync.changes`, which
   * must be consumed with `pages()` so each cursor can be saved with its
   * changes. `timeoutMs` applies to each page, as in `pages()`.
   */
  async *items<Id extends ItemsOperationId>(operation: Id, ...args: RequestArgs<Id>): AsyncGenerator<ItemOf<Id>> {
    for await (const page of this.pages(operation, ...args)) {
      for (const item of (page as unknown as { data: ItemOf<Id>[] }).data) yield item
    }
  }
}
