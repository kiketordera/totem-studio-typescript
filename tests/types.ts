/** Compile-time contract: operations retain literal enums, required paths/bodies, and discriminated feed variants. */
import { TotemClient } from '../src/index.js'
import type { FeedItem, Lead, ResponseOf } from '../src/index.js'

declare const client: TotemClient
declare const feed: FeedItem
declare const lead: Lead
const version: number = lead.version
void version
client.leads.search({ email: 'sdk@example.invalid' })
client.request('leads.get', { path: { id: 'lead_ABC' } })
client.request('leads.list', { query: { limit: 1, status: 'new' } })
// @ts-expect-error resource paths are required
client.request('leads.get')
// @ts-expect-error search bodies are required
client.request('leads.search')
// @ts-expect-error no writes are exposed
client.request('leads.delete', { path: { id: 'lead_ABC' } })
// @ts-expect-error unknown query keys are refused
client.leads.list({ updated_since: '2026-10-17' })
// @ts-expect-error invalid status enum
client.leads.list({ status: 'not_a_status' })
// @ts-expect-error search takes exactly one identifier
client.leads.search({ phone: '+12025550123', email: 'sdk@example.invalid' })
// @ts-expect-error one identifier is required
client.leads.search({})
// @ts-expect-error dictionary lists have no pagination parameters
client.members.list({ query: { cursor: 'none' } })
// @ts-expect-error detail operations cannot be paginated
client.pages('leads.get', { path: { id: 'lead_ABC' } })
if ('removed' in feed && feed.removed) {
  const reason: 'deleted' | 'erased' = feed.removed.reason
  void reason
}
declare const page: ResponseOf<'sync.changes'>
const checkpoint: string = page.next_cursor
void checkpoint
