/** Contract: pagination preserves tenant/filter state, treats cursors as opaque data, and halts at caught-up or invalid progress. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TotemClient, TotemApiError, TotemProtocolError } from '../dist/index.js';
import { KEY, serve } from './helpers.mjs';

test('items traverse pages with filters and team preserved', async context => {
  const requests = [];
  const baseUrl = await serve(context, request => {
    requests.push(request);
    return { body: requests.length === 1 ? { object: 'list', data: [{ id: 'lead_one' }], has_more: true, next_cursor: 'opaque+/=two' } : { object: 'list', data: [{ id: 'lead_two' }], has_more: false, next_cursor: null } };
  });
  const client = new TotemClient({ apiKey: KEY, baseUrl, team: 'team_A' });
  const ids = [];
  for await (const lead of client.items('leads.list', { query: { limit: 1, status: 'new' } })) ids.push(lead.id);
  assert.deepEqual(ids, ['lead_one', 'lead_two']);
  assert.equal(requests[0].url, '/v1/leads?limit=1&status=new');
  assert.equal(requests[1].url, '/v1/leads?limit=1&status=new&cursor=opaque%2B%2F%3Dtwo');
  assert.equal(requests[1].headers['totem-team'], 'team_A');
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
test('breaking iteration does not prefetch the next page', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { body: { object: 'list', data: [{ id: 'call_one' }], has_more: true, next_cursor: 'next' } }; });
  for await (const item of new TotemClient({ apiKey: KEY, baseUrl }).items('calls.list')) { assert.equal(item.id, 'call_one'); break; }
  assert.equal(count, 1);
});
