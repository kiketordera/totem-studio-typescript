/** Exercise every published operation against a Totem-owned test team; never logs credentials or records. */
import { readFile, stat, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { TotemClient, TotemApiError, CONTRACT_SHA256 } from '../dist/index.js';
import { operationDefinitions } from '../dist/generated/operations.js';

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
function validate(value, expected, path = '$') {
  if (expected.$ref) validate(value, schema.components.schemas[expected.$ref.split('/').at(-1)], path);
  for (const combinator of ['anyOf', 'oneOf', 'allOf']) {
    if (!expected[combinator]) continue;
    const valid = expected[combinator].filter(branch => { try { validate(value, branch, path); return true; } catch { return false; } }).length;
    assert.ok(combinator === 'allOf' ? valid === expected[combinator].length : combinator === 'oneOf' ? valid === 1 : valid >= 1, `${path}: ${combinator}`);
  }
  if (Object.hasOwn(expected, 'const')) assert.deepEqual(value, expected.const, `${path}: const`);
  if (expected.enum) assert.ok(expected.enum.includes(value), `${path}: enum`);
  if (expected.type) {
    const types = Array.isArray(expected.type) ? expected.type : [expected.type];
    assert.ok(types.some(type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'integer' ? Number.isInteger(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : typeof value === type), `${path}: type`);
  }
  if (typeof value === 'string') {
    if (expected.pattern) assert.match(value, new RegExp(expected.pattern), `${path}: pattern`);
    if (expected.minLength !== undefined) assert.ok(value.length >= expected.minLength, `${path}: minLength`);
    if (expected.maxLength !== undefined) assert.ok(value.length <= expected.maxLength, `${path}: maxLength`);
    if (expected.format === 'date-time') assert.ok(Number.isFinite(Date.parse(value)), `${path}: date-time`);
  }
  if (typeof value === 'number') {
    if (expected.minimum !== undefined) assert.ok(value >= expected.minimum, `${path}: minimum`);
    if (expected.maximum !== undefined) assert.ok(value <= expected.maximum, `${path}: maximum`);
  }
  if (Array.isArray(value) && expected.items) value.forEach((item, index) => validate(item, expected.items, `${path}[${index}]`));
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of expected.required ?? []) assert.ok(Object.hasOwn(value, key), `${path}.${key}: required`);
    for (const [key, child] of Object.entries(expected.properties ?? {})) if (Object.hasOwn(value, key)) validate(value[key], child, `${path}.${key}`);
  }
}
async function run(id, input = {}) {
  const result = await client.requestWithResponse(id, input);
  const definition = operationDefinitions[id];
  const operation = schema.paths[definition.path][definition.method.toLowerCase()];
  validate(result.data, operation.responses['200'].content['application/json'].schema);
  assert.ok(result.requestId, `${id}: missing request id`);
  covered.add(id);
  checks.push({ operation: id, status: result.status, requestId: result.requestId, passed: true });
  console.log(`PASS ${id} (${result.status})`);
  return result.data;
}
async function negative(label, operation, input, expectedStatus, expectedCode) {
  try { await operation(input); assert.fail(`${label}: unexpectedly succeeded`); }
  catch (error) {
    assert.ok(error instanceof TotemApiError, `${label}: expected TotemApiError`);
    assert.equal(error.status, expectedStatus, `${label}: status`);
    if (expectedCode) assert.equal(error.code, expectedCode, `${label}: code`);
    assert.ok(error.requestId, `${label}: missing request id`);
    checks.push({ check: label, status: error.status, code: error.code, requestId: error.requestId, passed: true });
    console.log(`PASS ${label} (${error.status} ${error.code})`);
  }
}
const startedAt = new Date().toISOString();
let failed = null;
try {
  await run('health');
  await run('me.get');
  const teams = await run('teams.list');
  const team = process.env.TOTEM_TEAM_ID ?? fixtures.teamId ?? teams.data[0]?.id;
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
  failed = error instanceof TotemApiError ? `${error.status} ${error.code} request ${error.requestId}` : `${error.name}: ${error.message}`;
  // Never print stack traces, HTTP request objects, credentials, or response records.
  console.error(`FAIL ${failed.replaceAll(apiKey, '[REDACTED]')}`);
}
const receipt = { startedAt, endedAt: new Date().toISOString(), contractSha256: CONTRACT_SHA256, coveredOperations: [...covered], checks, passed: failed === null, failure: failed?.replaceAll(apiKey, '[REDACTED]') ?? null };
if (process.env.TOTEM_SMOKE_RECEIPT) await writeFile(process.env.TOTEM_SMOKE_RECEIPT, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
console.log(`${covered.size}/${Object.keys(operationDefinitions).length} operations verified`);
if (failed) process.exitCode = 1;
