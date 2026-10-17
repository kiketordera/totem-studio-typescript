import { TotemApiError, TotemClient, isFeedRemoval } from '../src/index.js'
import type { FeedItem, FeedUpsert } from '../src/index.js'

export type Change =
  | { op: 'delete'; kind: FeedItem['kind']; id: string; version: number }
  | { op: 'upsert'; item: FeedUpsert }

interface SyncStore {
  loadCursor(team: string): Promise<string | undefined>
  /** The version you hold for a record, including the version of a deletion you applied. */
  heldVersion(team: string, kind: FeedItem['kind'], id: string): Promise<number | undefined>
  /** In one transaction: apply the changes, then save the cursor. */
  commit(team: string, changes: Change[], nextCursor: string): Promise<void>
  /** The documented full resync: mark every record, re-read the feed from the start, then sweep what was not seen. */
  resync(team: string): Promise<void>
  /** Delete the team's copy and its cursor. */
  dropTeam(team: string): Promise<void>
}

/** Call every 1–5 minutes, one team at a time. */
export async function syncTeam(apiKey: string, team: string, store: SyncStore, signal?: AbortSignal) {
  const client = new TotemClient({ apiKey, team })
  try {
    // timeoutMs applies to each page; the signal bounds the whole run.
    for await (const page of client.pages('sync.changes', { query: { limit: 100, cursor: await store.loadCursor(team) }, signal })) {
      const changes: Change[] = []
      for (const item of page.data) {
        // The feed can deliver a record more than once: apply only a newer version.
        const held = await store.heldVersion(team, item.kind, item.id)
        if (held !== undefined && item.version <= held) continue
        // Check for a removal before reading `object`.
        if (isFeedRemoval(item)) changes.push({ op: 'delete', kind: item.kind, id: item.id, version: item.version })
        else changes.push({ op: 'upsert', item })
      }
      // Save the cursor even when the page is empty or has_more is false.
      await store.commit(team, changes, page.next_cursor)
    }
  } catch (error) {
    if (!(error instanceof TotemApiError)) throw error
    switch (error.action) {
      case 'resync': // 409 resync_required or 410 sync_cursor_expired
        return store.resync(team)
      case 'wait_capture': // 409 capture_not_ready: never resync; keep the data and cursor, retry in a few minutes
      case 'keep_and_retry': // a 403 such as team_state_restricted: keep the data and cursor, retry later
        return
      case 'drop_team': { // 404 team_not_accessible: re-read the teams before deleting anything
        const teams = await client.teams.list()
        if (!teams.data.some(listed => listed.id === team)) await store.dropTeam(team)
        return
      }
      default:
        throw error
    }
  }
}
