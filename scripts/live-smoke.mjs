/**
 * Exercise every published operation against a Totem-owned test team; never
 * logs credentials or records. Responses are validated closed-world (an
 * undeclared field fails). Diagnostics are closed: operation ids, check
 * labels, schema codes, schema-derived paths, request ids and the server
 * release, each validated before it is printed or written to the receipt.
 */
import { readFile, stat, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { TotemClient, TotemApiError, CONTRACT_SHA256, SDK_VERSION } from '../dist/index.js';
import { operationDefinitions } from '../dist/generated/operations.js';
import { parseSecretKey, wrongSecretKey } from './key-format.mjs';
import { ResponseValidationError, VALIDATION_CODES, validateResponse } from './schema-validation.mjs';

const FIXTURE_FIELDS = ['teamId', 'leadId', 'callId', 'conversationId', 'bookingId', 'notificationId', 'searchEmail', 'foreignLeadId', 'foreignTeamId'];
const SYNC_PAGE_BUDGET = 5;
const SAFE_SCHEMA_PATH = /^\$(?:\.[A-Za-z0-9_]+|\[\d+\]|\.\*)*$/;
const safeRelease = value => typeof value === 'string' && /^[0-9a-f]{7,40}$/.test(value) ? value : null;

/** A configuration problem, named by a closed reason; its message is never a file's content. */
class SmokeConfigError extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}
class FixtureMissingError extends Error {
  constructor(fixture) { super(fixture); this.fixture = fixture; }
}

async function configuration() {
  const keyFile = process.env.TOTEM_API_KEY_FILE;
  let apiKey = process.env.TOTEM_API_KEY;
  if (keyFile) {
    const info = await stat(keyFile).catch(() => { throw new SmokeConfigError('key_file_unreadable'); });
    if (info.mode & 0o077) throw new SmokeConfigError('key_file_mode');
    apiKey = (await readFile(keyFile, 'utf8').catch(() => { throw new SmokeConfigError('key_file_unreadable'); })).trim();
  }
  if (!apiKey) throw new SmokeConfigError('key_missing');
  // A key the API would refuse unread fails here, before any request; its parts give the wrong-secret check its key.
  if (/[\r\n]/.test(apiKey) || !parseSecretKey(apiKey)) throw new SmokeConfigError('key_invalid');
  let fixtures = {};
  if (process.env.TOTEM_LIVE_FIXTURES_FILE) {
    const text = await readFile(process.env.TOTEM_LIVE_FIXTURES_FILE, 'utf8').catch(() => { throw new SmokeConfigError('fixtures_unreadable'); });
    try { fixtures = JSON.parse(text); } catch { throw new SmokeConfigError('fixtures_invalid_json'); }
    if (!fixtures || typeof fixtures !== 'object' || Array.isArray(fixtures)
      || Object.entries(fixtures).some(([field, value]) => !FIXTURE_FIELDS.includes(field) || typeof value !== 'string' || !value)) throw new SmokeConfigError('fixtures_invalid');
  }
  const baseUrl = process.env.TOTEM_API_BASE_URL;
  const common = { apiKey, ...(baseUrl ? { baseUrl } : {}), maxRetries: 0, timeoutMs: 30_000 };
  try { new TotemClient(common); } catch { throw new SmokeConfigError('base_url_invalid'); }
  return { apiKey, fixtures, common };
}

async function writeReceipt(receipt) {
  if (!process.env.TOTEM_SMOKE_RECEIPT) return;
  try { await writeFile(process.env.TOTEM_SMOKE_RECEIPT, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 }); }
  catch { console.error('FAIL smoke_receipt_unwritable'); process.exitCode = 1; }
}

async function main() {
  const startedAt = new Date().toISOString();
  const base = { startedAt, sdkVersion: SDK_VERSION, contractSha256: CONTRACT_SHA256 };
  let config;
  try { config = await configuration(); }
  catch (error) {
    const reason = error instanceof SmokeConfigError ? error.reason : 'unexpected';
    console.error(`FAIL smoke_configuration_failed ${reason}`);
    await writeReceipt({ ...base, endedAt: new Date().toISOString(), passed: false, failure: { code: 'smoke_configuration_failed', reason } });
    process.exitCode = 1;
    return;
  }
  const { apiKey, fixtures, common } = config;
  const allowPartial = process.env.TOTEM_SMOKE_ALLOW_PARTIAL === '1';
  const unscoped = new TotemClient(common);
  let client = unscoped;
  const schema = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
  const checks = [];
  const covered = new Set();
  const skippedChecks = [];
  const feedVariants = new Set();
  let serverRelease = null;
  let syncPages = 0;
  /** What is running now, for the failure record: { operation } or { check }, plus the response's request id. */
  let current = null;
  const safeRequestId = value => typeof value === 'string' && /^req_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) && !value.includes(apiKey) ? value : null;
  async function run(id, input = {}) {
    current = { operation: id, requestId: null };
    const result = await client.requestWithResponse(id, input);
    current.requestId = safeRequestId(result.requestId);
    if (id === 'health') serverRelease = safeRelease(result.headers.get('Totem-Release'));
    const definition = operationDefinitions[id];
    const operation = schema.paths[definition.path][definition.method.toLowerCase()];
    validateResponse(result.data, operation.responses['200'].content['application/json'].schema, schema, { closed: true });
    assert.ok(current.requestId, `${id}: missing request id`);
    covered.add(id);
    checks.push({ operation: id, status: result.status, requestId: current.requestId, passed: true });
    console.log(`PASS ${id} (${result.status})`);
    return result.data;
  }
  async function negative(label, operation, expectedStatus, expectedCode) {
    current = { check: label, requestId: null };
    try { await operation(); assert.fail(`${label}: unexpectedly succeeded`); }
    catch (error) {
      if (!(error instanceof TotemApiError)) throw error;
      current.requestId = safeRequestId(error.requestId);
      assert.equal(error.status, expectedStatus, `${label}: status`);
      assert.equal(error.code, expectedCode, `${label}: code`);
      assert.ok(current.requestId, `${label}: missing request id`);
      checks.push({ check: label, status: error.status, code: error.code, requestId: current.requestId, passed: true });
      console.log(`PASS ${label} (${error.status} ${error.code})`);
    }
  }
  /** Walks at most SYNC_PAGE_BUDGET feed pages; once caught up, resumes once from the saved cursor. A repeated page or cursor means the cursor was ignored. */
  async function walkFeed() {
    let cursor = null;
    let previous = '';
    const cursors = new Set();
    for (let page = 1; page <= SYNC_PAGE_BUDGET; page++) {
      const feed = await run('sync.changes', { query: { limit: 100, cursor } });
      syncPages++;
      // `kind` and `removed` were just validated against closed enums: value-free.
      for (const item of feed.data) feedVariants.add(item.removed ? `${item.kind}:removed` : item.kind);
      const tuples = feed.data.map(item => `${item.kind}\u0000${item.id}\u0000${item.version}`).join('\n');
      current = { check: 'sync walk progress', requestId: current.requestId };
      // A record can be delivered more than once, so only a whole repeated page proves the cursor was ignored.
      assert.ok(!tuples || tuples !== previous, 'sync walk repeated a page');
      assert.ok(!feed.has_more || !cursors.has(feed.next_cursor), 'sync walk repeated a cursor');
      cursors.add(feed.next_cursor);
      previous = tuples;
      cursor = feed.next_cursor;
      if (!feed.has_more && page > 1) return;
    }
  }
  let failed = null;
  try {
    await run('health');
    await run('me.get');
    const teams = await run('teams.list');
    const team = process.env.TOTEM_TEAM_ID || fixtures.teamId || teams.data[0]?.id;
    if (!team) throw new FixtureMissingError('teamId');
    client = new TotemClient({ ...common, team });
    await run('teams.get', { path: { id: team } });
    await run('boards.list', { query: { limit: 1 } });
    await run('members.list');
    await run('booking_services.list');
    const rows = {};
    for (const resource of ['leads', 'calls', 'conversations', 'bookings', 'notifications']) rows[resource] = await run(`${resource}.list`, { query: { limit: 1 } });
    for (const [resource, fixture] of [['leads', 'leadId'], ['calls', 'callId'], ['conversations', 'conversationId'], ['bookings', 'bookingId'], ['notifications', 'notificationId']]) {
      const id = fixtures[fixture] ?? rows[resource].data[0]?.id;
      if (!id) throw new FixtureMissingError(fixture);
      await run(`${resource}.get`, { path: { id } });
      if (resource === 'leads') await run('leads.activities', { path: { id }, query: { limit: 1 } });
    }
    await run('leads.search', { body: { email: fixtures.searchEmail ?? 'sdk-smoke-no-match@example.invalid' } });
    await walkFeed();
    // Well-formed, with this key's lookup id and another secret: the API must find the key and refuse the secret. Never printed or recorded.
    const badKeyClient = new TotemClient({ ...common, apiKey: wrongSecretKey(apiKey) });
    await negative('invalid credentials', () => badKeyClient.me.get(), 401, 'invalid_credentials');
    await negative('invalid limit', () => client.request('leads.list', { query: { limit: 0 } }), 400, 'invalid_request');
    await negative('search requires one identifier', () => client.request('leads.search', { body: {} }), 400, 'invalid_request');
    if (teams.data.length > 1) await negative('team required on a multi-team key', () => unscoped.request('leads.list', { query: { limit: 1 } }), 400, 'team_required');
    if (fixtures.foreignLeadId) await negative('foreign lead isolation', () => client.leads.get(fixtures.foreignLeadId), 404, 'resource_missing');
    else skippedChecks.push('foreign_lead_isolation');
    if (fixtures.foreignTeamId) await negative('foreign team isolation', () => client.request('leads.list', { team: fixtures.foreignTeamId, query: { limit: 1 } }), 404, 'team_not_accessible');
    else skippedChecks.push('foreign_team_isolation');
    current = { check: 'endpoint coverage', requestId: null };
    assert.equal(covered.size, Object.keys(operationDefinitions).length, 'Incomplete endpoint coverage');
  } catch (error) {
    const requestId = error instanceof TotemApiError ? safeRequestId(error.requestId) : current?.requestId ?? null;
    const apiCode = error instanceof TotemApiError && Object.hasOwn(schema['x-totem-errors'] ?? {}, error.code) ? error.code : null;
    const code = error instanceof TotemApiError ? 'api_error' : error instanceof ResponseValidationError ? 'response_schema_mismatch' : error instanceof assert.AssertionError ? 'expectation_failed' : error instanceof FixtureMissingError ? 'fixture_missing' : 'smoke_failed';
    // Closed fields only: arbitrary provider/assertion messages can contain records.
    failed = {
      code, status: error instanceof TotemApiError ? error.status : null, apiCode, requestId,
      operation: current?.operation ?? null,
      check: current?.check ?? null,
      schemaCode: error instanceof ResponseValidationError && VALIDATION_CODES.has(error.code) ? error.code : null,
      schemaPath: error instanceof ResponseValidationError && SAFE_SCHEMA_PATH.test(error.path) ? error.path : null,
      missingFixture: error instanceof FixtureMissingError ? error.fixture : null,
    };
    const where = failed.operation ?? failed.check;
    console.error(`FAIL ${code}${apiCode ? ` ${apiCode}` : ''}${where ? ` at ${where}` : ''}${failed.schemaCode ? ` ${failed.schemaCode} ${failed.schemaPath ?? ''}`.trimEnd() : ''}${failed.missingFixture ? ` needs ${failed.missingFixture}` : ''}${requestId ? ` request ${requestId}` : ''}`);
  }
  if (!failed && skippedChecks.length && !allowPartial) {
    failed = { code: 'checks_skipped', status: null, apiCode: null, requestId: null, operation: null, check: null, schemaCode: null, schemaPath: null, missingFixture: null };
    console.error(`FAIL checks_skipped ${skippedChecks.join(' ')} (add the foreign fixtures, or set TOTEM_SMOKE_ALLOW_PARTIAL=1 to accept a partial run)`);
  }
  const receipt = { ...base, endedAt: new Date().toISOString(), serverRelease, coveredOperations: [...covered], checks, skippedChecks, allowPartial, syncPages, feedVariants: [...feedVariants].sort(), passed: failed === null, failure: failed };
  await writeReceipt(receipt);
  console.log(`${covered.size}/${Object.keys(operationDefinitions).length} operations verified${skippedChecks.length ? `; skipped ${skippedChecks.join(', ')}` : ''}`);
  if (failed) process.exitCode = 1;
}
await main().catch(() => { console.error('FAIL smoke_failed'); process.exitCode = 1; });
