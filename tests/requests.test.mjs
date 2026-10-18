/**
 * Contract: every public method sends the documented verb, URL, team binding,
 * content type, User-Agent and server-only credentials. A per-request team
 * wins over the client default on collection routes and is never sent on
 * detail routes. Configuration and input guards refuse before any request.
 * The fetch, default or custom, is called unbound and may answer synchronously.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TotemClient, TotemApiError, SDK_VERSION } from '../dist/index.js';
import { KEY, problem, serve } from './helpers.mjs';

const routes = [
  ['integration', client => client.me.get(), 'GET', '/v1/me', false],
  ['teams', client => client.teams.list(), 'GET', '/v1/teams', false],
  ['team', client => client.teams.get('team_ABC'), 'GET', '/v1/teams/team_ABC', false],
  ['boards', client => client.boards.list({ limit: 2 }), 'GET', '/v1/boards?limit=2', true],
  ['members', client => client.members.list(), 'GET', '/v1/members', true],
  ['services', client => client.bookingServices.list(), 'GET', '/v1/booking_services', true],
  ['leads', client => client.leads.list({ status: 'new' }), 'GET', '/v1/leads?status=new', true],
  ['lead', client => client.leads.get('lead_ABC'), 'GET', '/v1/leads/lead_ABC', false],
  ['search', client => client.leads.search({ email: 'alice+crm@example.invalid' }), 'POST', '/v1/leads/search', true, '{"email":"alice+crm@example.invalid"}'],
  ['activities', client => client.leads.activities('lead_ABC', { limit: 1 }), 'GET', '/v1/leads/lead_ABC/activities?limit=1', false],
  ['calls', client => client.calls.list(), 'GET', '/v1/calls', true],
  ['call', client => client.calls.get('call_ABC'), 'GET', '/v1/calls/call_ABC', false],
  ['conversations', client => client.conversations.list(), 'GET', '/v1/conversations', true],
  ['conversation', client => client.conversations.get('conv_ABC'), 'GET', '/v1/conversations/conv_ABC', false],
  ['bookings', client => client.bookings.list(), 'GET', '/v1/bookings', true],
  ['booking', client => client.bookings.get('bkg_ABC'), 'GET', '/v1/bookings/bkg_ABC', false],
  ['changes', client => client.sync.changes({ limit: 1 }), 'GET', '/v1/sync/changes?limit=1', true],
  ['health', client => client.health(), 'GET', '/v1/health', false],
];
for (const [label, call, method, url, team, body = ''] of routes) {
  test(`wire route: ${label}`, async context => {
    const requests = [];
    const baseUrl = await serve(context, request => { requests.push(request); return { body: { result: 'accepted' } }; });
    const client = new TotemClient({ apiKey: KEY, team: 'team_SDK', baseUrl, maxRetries: 0 });
    assert.deepEqual(await call(client), { result: 'accepted' });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, method);
    assert.equal(requests[0].url, url);
    assert.equal(requests[0].body, body);
    // The edge refuses a POST body without exactly one application/json Content-Type.
    assert.equal(requests[0].headers['content-type'], method === 'POST' ? 'application/json' : undefined);
    assert.equal(requests[0].headers.authorization, label === 'health' ? undefined : `Bearer ${KEY}`);
    assert.equal(requests[0].headers['totem-team'], team ? 'team_SDK' : undefined);
  });
}
test('User-Agent names the package version, which SDK_VERSION exports', async context => {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const requests = [];
  const baseUrl = await serve(context, request => { requests.push(request); return { body: {} }; });
  await new TotemClient({ apiKey: KEY, baseUrl }).me.get();
  assert.equal(requests[0].headers['user-agent'], `@totemstudioai/sdk/${version}`);
  assert.equal(SDK_VERSION, version);
});
test('resource ids and cursors remain encoded URL data', async context => {
  const requests = [];
  const baseUrl = await serve(context, request => { requests.push(request); return {}; });
  const client = new TotemClient({ apiKey: KEY, baseUrl });
  await client.leads.get('lead_a/b?x=#é');
  await client.leads.list({ cursor: 'https://outside.invalid/a?token=x&z=+/#' });
  assert.equal(requests[0].url, '/v1/leads/lead_a%2Fb%3Fx%3D%23%C3%A9');
  assert.equal(requests[1].url, '/v1/leads?cursor=https%3A%2F%2Foutside.invalid%2Fa%3Ftoken%3Dx%26z%3D%2B%2F%23');
});
for (const id of ['', '.', '..']) {
  test(`refuses resource id ${JSON.stringify(id)} before sending`, async () => {
    let count = 0;
    const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return Response.json({}); } });
    // '.' would normalise /v1/leads/. to the list route.
    await assert.rejects(client.leads.get(id), /resource id/);
    assert.equal(count, 0);
  });
}
for (const [label, query, url] of [
  ['undefined', { cursor: undefined, limit: 2 }, '/v1/leads?limit=2'],
  ['null, as next_cursor is on a last page', { cursor: null }, '/v1/leads'],
]) {
  test(`a ${label} query value is omitted`, async context => {
    const requests = [];
    const baseUrl = await serve(context, request => { requests.push(request); return {}; });
    await new TotemClient({ apiKey: KEY, baseUrl }).leads.list(query);
    assert.equal(requests[0].url, url);
  });
}
test('server auth boundary detects a dropped Authorization header (negative control)', async context => {
  const baseUrl = await serve(context, request => request.headers.authorization === `Bearer ${KEY}` ? { body: { name: 'authorized' } } : { status: 401, body: problem(401, 'invalid_credentials') });
  const verify = async client => assert.deepEqual(await client.me.get(), { name: 'authorized' });
  await verify(new TotemClient({ apiKey: KEY, baseUrl }));
  const droppedAuth = async (url, init) => { const headers = new Headers(init.headers); headers.delete('Authorization'); return fetch(url, { ...init, headers }); };
  await assert.rejects(verify(new TotemClient({ apiKey: KEY, baseUrl, fetch: droppedAuth })), error => error instanceof TotemApiError && error.status === 401);
});
test('tenant selection reaches server and its isolation oracle rejects an injected wrong tenant', async context => {
  const baseUrl = await serve(context, request => request.headers['totem-team'] === 'team_A' ? { body: { object: 'list', data: [{ id: 'lead_A' }], has_more: false, next_cursor: null } } : { status: 404, body: problem(404, 'team_not_accessible') });
  const verify = async client => assert.deepEqual((await client.leads.list()).data, [{ id: 'lead_A' }]);
  await verify(new TotemClient({ apiKey: KEY, team: 'team_A', baseUrl }));
  const wrongTenant = async (url, init) => { const headers = new Headers(init.headers); headers.set('Totem-Team', 'team_B'); return fetch(url, { ...init, headers }); };
  await assert.rejects(verify(new TotemClient({ apiKey: KEY, team: 'team_A', baseUrl, fetch: wrongTenant })), error => error instanceof TotemApiError && error.status === 404);
});
test('a per-request team overrides the client default, and the oracle rejects the default (negative control)', async context => {
  const requests = [];
  const baseUrl = await serve(context, request => {
    requests.push(request);
    return request.headers['totem-team'] === 'team_B' ? { body: { object: 'list', data: [{ id: 'lead_B' }], has_more: false, next_cursor: null } } : { status: 404, body: problem(404, 'team_not_accessible') };
  });
  const client = new TotemClient({ apiKey: KEY, team: 'team_A', baseUrl });
  assert.deepEqual((await client.leads.list({}, { team: 'team_B' })).data, [{ id: 'lead_B' }]);
  await assert.rejects(client.leads.list(), error => error instanceof TotemApiError && error.code === 'team_not_accessible');
  // Detail routes take the team from the id: a team passed by a generic wrapper is not sent.
  await assert.rejects(client.leads.get('lead_X', { team: 'team_B' }), TotemApiError);
  assert.equal(requests.at(-1).url, '/v1/leads/lead_X');
  assert.equal(requests.at(-1).headers['totem-team'], undefined);
});
test('credentials remain private during ordinary serialization', () => {
  const client = new TotemClient({ apiKey: KEY });
  assert.equal(JSON.stringify(client).includes(KEY), false);
});
for (const baseUrl of ['http://api.totemstudio.ai/v1', 'https://user:pass@api.totemstudio.ai/v1', 'https://api.totemstudio.ai/v1?key=x', 'https://api.totemstudio.ai/v1#x', 'https://api.totemstudio.ai', 'https://api.totemstudio.ai/v2']) {
  test(`refuses unsafe or misrouted base URL: ${baseUrl}`, () => assert.throws(() => new TotemClient({ apiKey: KEY, baseUrl }), /baseUrl/));
}
for (const baseUrl of ['https://api.totemstudio.ai/v1/', 'https://staging.example.invalid', 'http://127.0.0.1:8787/api']) {
  test(`accepts base URL ${baseUrl}`, () => assert.ok(new TotemClient({ apiKey: KEY, baseUrl })));
}
for (const [label, options] of [
  ['timeoutMs 0', { timeoutMs: 0 }],
  ['timeoutMs Infinity', { timeoutMs: Infinity }],
  ['timeoutMs 1.5', { timeoutMs: 1.5 }],
  ['maxRetries 6', { maxRetries: 6 }],
  ['maxRetries -1', { maxRetries: -1 }],
  ['maxRetryDelayMs -1', { maxRetryDelayMs: -1 }],
  ['apiKey with a line break', { apiKey: `${KEY}\nInjected: 1` }],
  ['empty apiKey', { apiKey: ' ' }],
  ['fetch that is not a function', { fetch: 'x' }],
  ['empty team', { team: '' }],
  ['whitespace team, as from an empty env var', { team: '  ' }],
]) {
  test(`client configuration refuses ${label}`, () => {
    assert.throws(() => new TotemClient({ apiKey: KEY, fetch: async () => Response.json({}), ...options }), TypeError);
  });
}
const NonNativeSignal = { aborted: false, reason: undefined, addEventListener() {}, removeEventListener() {}, throwIfAborted() {} };
for (const [label, options] of [
  ['timeoutMs 0', { timeoutMs: 0 }],
  ['timeoutMs Infinity', { timeoutMs: Infinity }],
  ['empty team', { team: '' }],
  ['a signal that is not an AbortSignal', { signal: NonNativeSignal }],
]) {
  test(`request options refuse ${label} before sending`, async () => {
    let count = 0;
    const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return Response.json({ object: 'list', data: [], has_more: false, next_cursor: null }); } });
    await assert.rejects(client.leads.list({}, options), TypeError);
    assert.equal(count, 0);
  });
}
test('a refused signal leaves no deadline timer holding the process open', async () => {
  const timers = () => process.getActiveResourcesInfo().filter(resource => resource === 'Timeout').length;
  const before = timers();
  const client = new TotemClient({ apiKey: KEY, timeoutMs: 60_000, fetch: async () => Response.json({}) });
  await assert.rejects(client.me.get({ signal: NonNativeSignal }), /AbortSignal/);
  assert.equal(timers(), before);
});
for (const [label, globals, refused] of [
  ['a window', { window: {} }, true],
  ['a document', { document: {} }, true],
  ['a classic worker (importScripts)', { importScripts: () => {} }, true],
  ['a dedicated worker', { DedicatedWorkerGlobalScope: class {} }, true],
  ['a shared worker', { SharedWorkerGlobalScope: class {} }, true],
  ['a browser service worker', { ServiceWorkerGlobalScope: class {}, registration: {}, clients: {} }, true],
  ['an edge runtime with WorkerGlobalScope', { WorkerGlobalScope: class {} }, false],
  ['an edge runtime with ServiceWorkerGlobalScope only', { ServiceWorkerGlobalScope: class {} }, false],
]) {
  test(`${refused ? 'refuses' : 'allows'} ${label}`, context => {
    for (const [name, value] of Object.entries(globals)) globalThis[name] = value;
    context.after(() => { for (const name of Object.keys(globals)) delete globalThis[name]; });
    if (refused) assert.throws(() => new TotemClient({ apiKey: KEY }), /only be used on a server/);
    else assert.ok(new TotemClient({ apiKey: KEY }));
  });
}
test('the default fetch is called unbound, as workerd requires', async context => {
  const native = globalThis.fetch;
  context.mock.method(globalThis, 'fetch', function (input, init) {
    // workerd's fetch throws when `this` is any other object.
    if (this !== undefined && this !== globalThis) throw new TypeError('Illegal invocation');
    return native(input, init);
  });
  const baseUrl = await serve(context, () => ({ body: { name: 'reached' } }));
  assert.deepEqual(await new TotemClient({ apiKey: KEY, baseUrl, maxRetries: 0 }).me.get(), { name: 'reached' });
});
test('a custom fetch may return its Response synchronously', async () => {
  const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: () => Response.json({ name: 'synchronous' }) });
  assert.deepEqual(await client.me.get(), { name: 'synchronous' });
});
test('JavaScript callers cannot attach a body to a read route', async () => {
  let count = 0;
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return Response.json({}); } });
  await assert.rejects(client.request('me.get', { body: { unexpected: true } }), /does not accept a request body/);
  assert.equal(count, 0);
});
