/**
 * Compile-time contract (tsc -p tsconfig.examples.json, exactOptionalPropertyTypes on):
 * required paths/bodies; closed request enums and union discriminators, open
 * response enums ("Enums can grow"); `team` only on collection routes; optional
 * inputs accept undefined and null cursors; every component has a named alias;
 * the error catalogue is typed; `items()` refuses the checkpointed feed.
 */
import { TotemClient, TotemApiError, errorCatalogue, isFeedRemoval } from '../src/index.js'
import type {
  Activity, Booking, ErrorAction, FeedItem, FeedObjectOf, FeedRemoval, FeedUpsert, Health, ItemOf, Lead, LeadAttribution, LeadList,
  LeadResponse, Me, Notification, NotificationList, ResponseOf, Stage, TotemErrorCode,
} from '../src/index.js'

declare const client: TotemClient
declare const feed: FeedItem
declare const lead: Lead
declare const activity: Activity
declare const leadPage: LeadList
declare const maybe: string | undefined
type IsAny<T> = 0 extends 1 & T ? true : false

const version: number = lead.version
const birthday: string | null = lead.date_of_birth
const birthdayInFeed: string | null = ({} as FeedObjectOf<'lead'>).date_of_birth
const birthdayInDetail: string | null = ({} as ResponseOf<'leads.get'>).date_of_birth
const knownBirthday: Lead['date_of_birth'] = '2000-02-29'
const noBirthday: Lead['date_of_birth'] = null
// @ts-expect-error birthdays are required nullable calendar strings
const omittedBirthday: Lead['date_of_birth'] = undefined
// @ts-expect-error birthdays are not timestamp numbers
const timestampBirthday: Lead['date_of_birth'] = 951782400000
// @ts-expect-error birthdays are not JavaScript Date objects
const dateObjectBirthday: Lead['date_of_birth'] = new Date('2000-02-29')
void version; void birthday; void birthdayInFeed; void birthdayInDetail; void knownBirthday; void noBirthday
void omittedBirthday; void timestampBirthday; void dateObjectBirthday
client.leads.search({ email: 'sdk@example.invalid' })
client.request('leads.get', { path: { id: 'lead_ABC' } })
client.request('leads.list', { query: { limit: 1, status: 'new' } })
client.notifications.list({ limit: 100, cursor: null }, { team: 'team_A' })
client.notifications.list({ status: 'new' })
client.notifications.list({ status: 'read' })
client.notifications.list({ status: 'archived' })
client.notifications.list({ lead: 'lead_ABC' })
client.notifications.get('ntf_ABC')
client.items('notifications.list', { query: { limit: 100 } })
// @ts-expect-error notification detail routes take the team from the record id
client.notifications.get('ntf_ABC', { team: 'team_A' })
// @ts-expect-error notification paths are required
client.request('notifications.get')
// @ts-expect-error notifications are read-only
client.request('notifications.update', { path: { id: 'ntf_ABC' } })
// @ts-expect-error notification status request enum stays closed
client.notifications.list({ status: 'pending' })
// @ts-expect-error notification creation is not exposed
client.notifications.create({ summary: 'Call the lead' })
// @ts-expect-error resource paths are required
client.request('leads.get')
// @ts-expect-error search bodies are required
client.request('leads.search')
// @ts-expect-error no writes are exposed
client.request('leads.delete', { path: { id: 'lead_ABC' } })
// @ts-expect-error unknown query keys are refused
client.leads.list({ updated_since: '2026-10-17' })
// @ts-expect-error request enums stay closed: invalid status filter
client.leads.list({ status: 'not_a_status' })
// @ts-expect-error search takes exactly one identifier
client.leads.search({ phone: '+12025550123', email: 'sdk@example.invalid' })
// @ts-expect-error one identifier is required
client.leads.search({})
// @ts-expect-error dictionary lists take no pagination parameters
client.request('members.list', { query: { cursor: 'none' } })
client.request('boards.list', { query: { cursor: 'next' } })
// @ts-expect-error detail operations cannot be paginated
client.pages('leads.get', { path: { id: 'lead_ABC' } })
// @ts-expect-error items cannot checkpoint the changes feed: use pages
client.items('sync.changes')
client.pages('sync.changes', { query: { limit: 100 } })

// Optional inputs accept undefined (exactOptionalPropertyTypes) and a last page's null cursor.
void new TotemClient({ apiKey: 'tsk_live_fictitious', team: maybe, baseUrl: maybe, timeoutMs: undefined })
client.sync.changes({ cursor: maybe, limit: 100 })
client.leads.list({ cursor: leadPage.next_cursor })
client.leads.get('lead_1', { timeoutMs: undefined, signal: undefined })

// `team` selects the team only where the API reads Totem-Team.
client.leads.list({}, { team: 'team_A' })
client.request('sync.changes', { team: 'team_A' })
// @ts-expect-error detail routes take the team from the record id
client.leads.get('lead_1', { team: 'team_A' })
// @ts-expect-error detail routes take the team from the record id
client.request('calls.get', { path: { id: 'call_ABC' }, team: 'team_X' })

// Response enums can grow; discriminators stay closed so narrowing works.
declare const booking: Booking
const futureStatus: Booking['status'] = 'future_status'
const knownStatus: Booking['status'] = booking.status
void futureStatus; void knownStatus
const futureNotificationStatus: Notification['status'] = 'future_status'
const missingNotificationSummary: Notification['summary'] = null
void futureNotificationStatus; void missingNotificationSummary
if (activity.type === 'stage_changed') {
  const stage: string | null = activity.to.stage
  void stage
}
if (isFeedRemoval(feed)) {
  const kind: FeedUpsert['kind'] = feed.kind
  const removal: FeedRemoval = feed
  void kind; void removal
} else if (feed.kind === 'lead') {
  const object: Lead = feed.object
  void object
} else if (feed.kind === 'lead_attribution') {
  const attribution: LeadAttribution = feed.object
  void attribution
} else if (feed.kind === 'notification') {
  const notification: Notification = feed.object
  void notification
}
const notificationOfKind: FeedObjectOf<'notification'> = {} as Notification
const notificationPage: NotificationList = {} as ResponseOf<'notifications.list'>
const notificationItem: ItemOf<'notifications.list'> = {} as Notification
void notificationOfKind; void notificationPage; void notificationItem
const objectOfKind: FeedObjectOf<'lead_response'> = {} as LeadResponse
const stage: Stage['id'] = 'stg_1'
void objectOfKind; void stage

// Every component has an alias; the generic and named types agree.
const me: Me = {} as ResponseOf<'me.get'>
const health: Health = {} as ResponseOf<'health'>
void me; void health
const itemNotAny: IsAny<ItemOf<'leads.list'>> = false
const feedNotAny: IsAny<FeedItem> = false
void itemNotAny; void feedNotAny

// The error catalogue is typed; unknown codes remain representable.
const code: TotemErrorCode = 'rate_limited'
// @ts-expect-error a misspelt code is not a TotemErrorCode
const misspelt: TotemErrorCode = 'rate_limit'
const action: 'resync' = errorCatalogue.sync_cursor_expired.action
const anyAction: ErrorAction = errorCatalogue.capture_not_ready.action
// @ts-expect-error a misspelt catalogue key does not compile
void errorCatalogue.sync_cursor_exipred
declare const error: TotemApiError
const unknownCode: TotemApiError['code'] = 'brand_new_code'
const errorAction: ErrorAction | null = error.action
void code; void misspelt; void action; void anyAction; void unknownCode; void errorAction

declare const page: ResponseOf<'sync.changes'>
const checkpoint: string = page.next_cursor
void checkpoint
