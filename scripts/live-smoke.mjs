/** Exercise every published operation against a Totem-owned test team; never logs credentials or records. */
import { readFile, stat, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { TotemClient, TotemApiError, CONTRACT_SHA256 } from '../dist/index.js';
import { operationDefinitions } from '../dist/generated/operations.js';
import { ResponseValidationError, validateResponse } from './schema-validation.mjs';

async function main() {
  const keyFile = process.env.TOTEM_API_KEY_FILE;
  if (keyFile && (await stat(keyFile)).mode & 0o077) throw new Error('API key file must have mode 0600 (or stricter)');
  const apiKey = keyFile ? (await readFile(keyFile, 'utf8')).trim() : process.env.TOTEM_API_KEY;
  if (!apiKey) throw new Error('Set TOTEM_API_KEY_FILE (recommended) or TOTEM_API_KEY; credentials are never printed');
  const fixtures = process.env.TOTEM_LIVE_FIXTURES_FILE ? JSON.parse(await readFile(process.env.TOTEM_LIVE_FIXTURES_FILE, 'utf8')) : {};
  const baseUrl = process.env.TOTEM_API_BASE_URL;
  const common = { apiKey, ...(baseUrl ? { baseUrl } : {}), maxRetries: 0, timeoutMs: 30_000 };
  let client = new TotemClient(common);
  const schema = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
  const checks = [];
  const covered = new Set();
  const safeRequestId = value => typeof value === 'string' && /^req_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) && !value.includes(apiKey) ? value : null;
  async function run(id, input = {}) {
    const result = await client.requestWithResponse(id, input);
    const definition = operationDefinitions[id];
    const operation = schema.paths[definition.path][definition.method.toLowerCase()];
    validateResponse(result.data, operation.responses['200'].content['application/json'].schema, schema);
    assert.ok(safeRequestId(result.requestId), `${id}: missing request id`);
    covered.add(id);
    checks.push({ operation: id, status: result.status, requestId: safeRequestId(result.requestId), passed: true });
    console.log(`PASS ${id} (${result.status})`);
    return result.data;
  }
  async function negative(label, operation, input, expectedStatus, expectedCode) {
    try { await operation(input); assert.fail(`${label}: unexpectedly succeeded`); }
    catch (error) {
      assert.ok(error instanceof TotemApiError, `${label}: expected TotemApiError`);
      assert.equal(error.status, expectedStatus, `${label}: status`);
      if (expectedCode) assert.equal(error.code, expectedCode, `${label}: code`);
      assert.ok(safeRequestId(error.requestId), `${label}: missing request id`);
      checks.push({ check: label, status: error.status, code: error.code, requestId: safeRequestId(error.requestId), passed: true });
      console.log(`PASS ${label} (${error.status} ${error.code})`);
    }
  }
  const startedAt = new Date().toISOString();
  let failed = null;
  try {
    await run('health');
    await run('me.get');
    const teams = await run('teams.list');
    const team = process.env.TOTEM_TEAM_ID || fixtures.teamId || teams.data[0]?.id;
    if (!team) throw new Error('The integration has no team to test');
    client = new TotemClient({ ...common, team });
    await run('teams.get', { path: { id: team } });
    await run('boards.list', { query: { limit: 1 } });
    await run('members.list');
    await run('booking_services.list');
    const rows = {};
    for (const resource of ['leads', 'calls', 'conversations', 'bookings']) rows[resource] = await run(`${resource}.list`, { query: { limit: 1 } });
    for (const [resource, fixture] of [['leads', 'leadId'], ['calls', 'callId'], ['conversations', 'conversationId'], ['bookings', 'bookingId']]) {
      const id = fixtures[fixture] ?? rows[resource].data[0]?.id;
      if (!id) throw new Error(`Need ${fixture} in TOTEM_LIVE_FIXTURES_FILE or a captured ${resource} record for full route coverage`);
      await run(`${resource}.get`, { path: { id } });
      if (resource === 'leads') await run('leads.activities', { path: { id }, query: { limit: 1 } });
    }
    await run('leads.search', { body: { email: fixtures.searchEmail ?? 'sdk-smoke-no-match@example.invalid' } });
    const feed = await run('sync.changes', { query: { limit: 1 } });
    await run('sync.changes', { query: { cursor: feed.next_cursor, limit: 1 } });
    const badKeyClient = new TotemClient({ ...common, apiKey: 'tsk_live_invalid_sdk_smoke_key' });
    await negative('invalid credentials', () => badKeyClient.me.get(), undefined, 401, 'invalid_credentials');
    await negative('invalid limit', input => client.request('leads.list', input), { query: { limit: 0 } }, 400, 'invalid_request');
    await negative('search requires one identifier', input => client.request('leads.search', input), { body: {} }, 400, 'invalid_request');
    if (fixtures.foreignLeadId) await negative('foreign tenant isolation', input => client.leads.get(input), fixtures.foreignLeadId, 404, 'resource_missing');
    assert.equal(covered.size, Object.keys(operationDefinitions).length, 'Incomplete endpoint coverage');
  } catch (error) {
    const requestId = error instanceof TotemApiError ? safeRequestId(error.requestId) : null;
    const apiCode = error instanceof TotemApiError && Object.hasOwn(schema['x-totem-errors'] ?? {}, error.code) ? error.code : null;
    failed = { code: error instanceof TotemApiError ? 'api_error' : error instanceof ResponseValidationError ? 'response_schema_mismatch' : error instanceof assert.AssertionError ? 'expectation_failed' : 'smoke_failed', status: error instanceof TotemApiError ? error.status : null, apiCode, requestId };
    // Closed failure categories only: arbitrary provider/assertion messages can contain records.
    console.error(`FAIL ${failed.code}${apiCode ? ` ${apiCode}` : ''}${requestId ? ` request ${requestId}` : ''}`);
  }
  const receipt = { startedAt, endedAt: new Date().toISOString(), contractSha256: CONTRACT_SHA256, coveredOperations: [...covered], checks, passed: failed === null, failure: failed };
  if (process.env.TOTEM_SMOKE_RECEIPT) await writeFile(process.env.TOTEM_SMOKE_RECEIPT, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  console.log(`${covered.size}/${Object.keys(operationDefinitions).length} operations verified`);
  if (failed) process.exitCode = 1;

}
await main().catch(() => { console.error('FAIL smoke_configuration_failed'); process.exitCode = 1; });
