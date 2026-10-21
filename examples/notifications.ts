import { TotemClient } from '../src/index.js'
import type { Notification } from '../src/index.js'

interface CrmAlerts {
  /** Atomically upsert by notification.id only when notification.version is newer; repeated polls must not create another alert. */
  upsert(notification: Notification): Promise<void>
}

/**
 * Import Totem's currently new team notifications into an external CRM.
 * Reading never marks them read in Totem. This is a filtered snapshot: use
 * syncTeam from sync.ts for incremental updates, status changes and removals.
 */
export async function importNewNotifications(apiKey: string, team: string, crm: CrmAlerts, signal?: AbortSignal) {
  const client = new TotemClient({ apiKey, team })
  for await (const notification of client.items('notifications.list', {
    query: { status: 'new', limit: 100 },
    signal,
  })) {
    // summary can contain personal information: pass it only to the intended CRM.
    await crm.upsert(notification)
  }
}
