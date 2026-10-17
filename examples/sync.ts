import { TotemClient } from '../src/index.js'
import type { FeedItem } from '../src/index.js'

interface SyncStore {
  loadCursor(team: string): Promise<string | undefined>
  /** Atomically apply version checks, upserts/removals and save this cursor. */
  applyPage(team: string, changes: FeedItem[], nextCursor: string): Promise<void>
}

/** Call every 1–5 minutes. On sync_cursor_expired perform the documented full mark-and-sweep resync. */
export async function syncTeam(apiKey: string, team: string, store: SyncStore, signal?: AbortSignal) {
  const client = new TotemClient({ apiKey, team })
  const cursor = await store.loadCursor(team)
  for await (const page of client.pages('sync.changes', {
    query: { limit: 100, ...(cursor ? { cursor } : {}) },
    ...(signal ? { signal } : {}),
  })) {
    // Store the final cursor even when this page is empty or has_more is false.
    await store.applyPage(team, page.data, page.next_cursor)
  }
}
