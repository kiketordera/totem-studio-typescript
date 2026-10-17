/** Contract: every public method sends the documented verb, URL, team binding, and server-only credentials. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TotemClient, TotemApiError } from '../dist/index.js';
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
  ['booking', client => client.bookings.get('book_ABC'), 'GET', '/v1/bookings/book_ABC', false],
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
    assert.equal(requests[0].headers.authorization, label === 'health' ? undefined : `Bearer ${KEY}`);
    assert.equal(requests[0].headers['totem-team'], team ? 'team_SDK' : undefined);
  });
}
test('resource ids and cursors remain encoded URL data', async context => {
  const requests = [];
  const baseUrl = await serve(context, request => { requests.push(request); return {}; });
  const client = new TotemClient({ apiKey: KEY, baseUrl });
  await client.leads.get('lead_a/b?x=#é');
  await client.leads.list({ cursor: 'https://outside.invalid/a?token=x&z=+/#' });
  assert.equal(requests[0].url, '/v1/leads/lead_a%2Fb%3Fx%3D%23%C3%A9');
  assert.equal(requests[1].url, '/v1/leads?cursor=https%3A%2F%2Foutside.invalid%2Fa%3Ftoken%3Dx%26z%3D%2B%2F%23');
  await assert.rejects(client.leads.get('..'), /resource id/);
});
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
test('credentials remain private during ordinary serialization', () => {
  const client = new TotemClient({ apiKey: KEY });
  assert.equal(JSON.stringify(client).includes(KEY), false);
});
for (const baseUrl of ['http://api.totemstudio.ai/v1', 'https://user:pass@api.totemstudio.ai/v1', 'https://api.totemstudio.ai/v1?key=x', 'https://api.totemstudio.ai/v1#x']) {
  test(`refuses unsafe configured base URL: ${baseUrl}`, () => assert.throws(() => new TotemClient({ apiKey: KEY, baseUrl }), /baseUrl/));
}
test('refuses browser contexts before using a secret', context => {
  globalThis.window = {};
  context.after(() => { delete globalThis.window; });
  assert.throws(() => new TotemClient({ apiKey: KEY }), /only be used on a server/);
});

test('JavaScript callers cannot attach a body to a read route', async () => {
  let count = 0;
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return Response.json({}); } });
  await assert.rejects(client.request('me.get', { body: { unexpected: true } }), /does not accept a request body/);
  assert.equal(count, 0);
});
