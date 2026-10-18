import { TotemApiError, TotemClient } from '../src/index.js'

/** Read the key from your server's secret manager or environment. Never include it in browser code. */
export async function listNewLeads(apiKey: string, team?: string) {
  const client = new TotemClient({ apiKey, team })
  try {
    const integration = await client.me.get()
    console.log(`Connected to ${integration.name}`)
    for await (const lead of client.items('leads.list', { query: { status: 'new', limit: 100 } })) {
      // Enums can grow: keep a default branch for statuses this SDK does not know yet.
      // Log ids, not names or contact details: they are personal data.
      console.log(lead.id, lead.status ?? 'none')
    }
  } catch (error) {
    // The message names only status, code and parameter; quote requestId to support.
    if (error instanceof TotemApiError) console.error(error.status, error.code, error.action, error.param, error.requestId)
    throw error
  }
}
