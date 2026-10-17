import { TotemApiError, TotemClient } from '../src/index.js'

/** Read the key from your server's secret manager or environment. Never include it in browser code. */
export async function listNewLeads(apiKey: string, team?: string) {
  const client = new TotemClient({ apiKey, ...(team ? { team } : {}) })
  try {
    const integration = await client.me.get()
    console.log(`Connected to ${integration.name}`)
    for await (const lead of client.items('leads.list', { query: { status: 'new', limit: 100 } })) {
      console.log(lead.id, lead.name)
    }
  } catch (error) {
    if (error instanceof TotemApiError) console.error(error.code, error.status, error.requestId)
    throw error
  }
}
