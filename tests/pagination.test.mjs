/** Contract: pagination preserves tenant/filter state, treats cursors as opaque data, and halts at caught-up or invalid progress; isFeedRemoval tells a feed removal from an upsert. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TotemClient, TotemApiError, TotemProtocolError, isFeedRemoval } from '../dist/index.js';
import { KEY, problem, serve } from './helpers.mjs';

for (const [label, operation, path, filter, queryString, ids] of [
  ['lead status', 'leads.list', 'leads', { status: 'new' }, 'status=new', ['lead_one', 'lead_two']],
  ['notification status', 'notifications.list', 'notifications', { status: 'new' }, 'status=new', ['ntf_one', 'ntf_two']],
  ['notification lead', 'notifications.list', 'notifications', { lead: 'lead_CRM' }, 'lead=lead_CRM', ['ntf_one', 'ntf_two']],
]) {
  test(`items traverse pages with filters and team preserved: ${label}`, async context => {
    const requests = [];
    const baseUrl = await serve(context, request => {
      requests.push(request);
      return { body: requests.length === 1 ? { object: 'list', data: [{ id: ids[0] }], has_more: true, next_cursor: 'opaque+/=two' } : { object: 'list', data: [{ id: ids[1] }], has_more: false, next_cursor: null } };
    });
    const client = new TotemClient({ apiKey: KEY, baseUrl, team: 'team_A' });
    const actualIds = [];
    for await (const item of client.items(operation, { query: { limit: 1, ...filter } })) actualIds.push(item.id);
    assert.deepEqual(actualIds, ids);
    assert.equal(requests[0].url, `/v1/${path}?limit=1&${queryString}`);
    assert.equal(requests[1].url, `/v1/${path}?limit=1&${queryString}&cursor=opaque%2B%2F%3Dtwo`);
    assert.equal(requests[1].headers['totem-team'], 'team_A');
  });
}
test('a per-request team is kept on every page, over the client default', async context => {
  const requests = [];
  const baseUrl = await serve(context, request => {
    requests.push(request);
    if (request.headers['totem-team'] !== 'team_B') return { status: 404, body: problem(404, 'team_not_accessible') };
    return { body: requests.length === 1 ? { object: 'list', data: [{ id: 'lead_one' }], has_more: true, next_cursor: 'two' } : { object: 'list', data: [{ id: 'lead_two' }], has_more: false, next_cursor: null } };
  });
  const pages = [];
  for await (const page of new TotemClient({ apiKey: KEY, baseUrl, team: 'team_A' }).pages('leads.list', { team: 'team_B' })) pages.push(page.data[0].id);
  assert.deepEqual(pages, ['lead_one', 'lead_two']);
  assert.deepEqual(requests.map(request => request.headers['totem-team']), ['team_B', 'team_B']);
});
test('URL-like cursor never changes the destination host or API path', async context => {
  let foreignRequests = 0;
  const foreign = await serve(context, () => { foreignRequests++; return {}; });
  const requests = [];
  const baseUrl = await serve(context, request => { requests.push(request); return { body: requests.length === 1 ? { object: 'list', data: [], has_more: true, next_cursor: `${foreign}/steal` } : { object: 'list', data: [], has_more: false, next_cursor: null } }; });
  for await (const _page of new TotemClient({ apiKey: KEY, baseUrl }).pages('calls.list')) { /* consume */ }
  assert.equal(foreignRequests, 0);
  assert.equal(requests.length, 2);
  assert.ok(requests[1].url.startsWith('/v1/calls?cursor=http%3A%2F%2F127.0.0.1%3A'));
  assert.equal(requests[1].headers.authorization, `Bearer ${KEY}`);
});
test('HTTP redirects are surfaced without following to another host', async context => {
  let foreignRequests = 0;
  const foreign = await serve(context, () => { foreignRequests++; return {}; });
  const baseUrl = await serve(context, () => ({ status: 302, headers: { Location: `${foreign}/steal` } }));
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl }).me.get(), error => error instanceof TotemApiError && error.status === 302);
  assert.equal(foreignRequests, 0);
});
test('sync yields final empty page and retains its checkpoint', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { body: { object: 'list', data: [], has_more: false, next_cursor: 'resume_saved_after_apply' } }; });
  const pages = [];
  for await (const page of new TotemClient({ apiKey: KEY, baseUrl }).pages('sync.changes')) pages.push(page);
  assert.deepEqual(pages, [{ object: 'list', data: [], has_more: false, next_cursor: 'resume_saved_after_apply' }]);
  assert.equal(count, 1);
});
for (const [label, next] of [['missing', null], ['empty', ''], ['repeated', 'already_seen']]) {
  test(`refuses ${label} cursor when has_more is true`, async context => {
    const baseUrl = await serve(context, () => ({ body: { object: 'list', data: [], has_more: true, next_cursor: next } }));
    await assert.rejects(async () => { for await (const _page of new TotemClient({ apiKey: KEY, baseUrl }).pages('calls.list', { query: { cursor: 'already_seen' } })) { /* consume */ } }, error => error instanceof TotemProtocolError && error.requestId === 'req_fixture_01');
  });
}
test('refuses a cursor cycle that never repeats the starting cursor', { timeout: 5000 }, async context => {
  const cycle = ['c1', 'c2', 'c1', 'c2'];
  let count = 0;
  const baseUrl = await serve(context, () => ({ body: { object: 'list', data: [], has_more: true, next_cursor: cycle[count++] } }));
  await assert.rejects(async () => { for await (const _page of new TotemClient({ apiKey: KEY, baseUrl }).pages('calls.list')) { /* consume */ } }, error => error instanceof TotemProtocolError && /repeated cursor/.test(error.message));
  assert.equal(count, 3);
});
test('a successful body that is not a list page is a protocol error', async context => {
  const baseUrl = await serve(context, () => ({ body: { ok: true } }));
  await assert.rejects(async () => { for await (const _page of new TotemClient({ apiKey: KEY, baseUrl }).pages('calls.list')) { /* consume */ } }, error => error instanceof TotemProtocolError && error.message === 'Expected a Totem list page');
});
test('breaking iteration does not prefetch the next page', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { body: { object: 'list', data: [{ id: 'call_one' }], has_more: true, next_cursor: 'next' } }; });
  for await (const item of new TotemClient({ apiKey: KEY, baseUrl }).items('calls.list')) { assert.equal(item.id, 'call_one'); break; }
  assert.equal(count, 1);
});
for (const [label, item, removal] of [
  ['a removal', { kind: 'lead', id: 'lead_1', version: 2, removed: { reason: 'deleted' } }, true],
  ['an erasure', { kind: 'call', id: 'call_1', version: 5, removed: { reason: 'erased' } }, true],
  ['an upsert', { kind: 'lead', id: 'lead_1', version: 3, object: { id: 'lead_1' } }, false],
  ['an upsert with a null removed field', { kind: 'lead', id: 'lead_1', version: 3, object: { id: 'lead_1' }, removed: null }, false],
  ['a notification upsert', { kind: 'notification', id: 'ntf_1', version: 1, object: { id: 'ntf_1' } }, false],
  ['a notification removal', { kind: 'notification', id: 'ntf_1', version: 2, removed: { reason: 'deleted' } }, true],
]) {
  test(`isFeedRemoval: ${label}`, () => assert.equal(isFeedRemoval(item), removal));
}
