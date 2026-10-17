/**
 * Contract: problem errors keep support metadata and the catalogue's action,
 * and their message names status, code and parameter only. Retries are
 * bounded by maxRetries, honour only well-formed Retry-After values (capped
 * by maxRetryDelayMs), jitter the SDK's own backoff, and never retry
 * authorization, validation or feed-state failures.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TotemApiError, TotemClient, TotemConnectionError, TotemError, TotemProtocolError } from '../dist/index.js';
import { KEY, problem, serve } from './helpers.mjs';

const contract = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
const list = { object: 'list', data: [], has_more: false, next_cursor: null };

for (const [status, code, action] of [
  [400, 'invalid_request', 'fix_request'],
  [401, 'invalid_credentials', 'check_credentials'],
  [403, 'ip_not_allowed', 'check_credentials'],
  [403, 'team_state_restricted', 'keep_and_retry'],
  [404, 'resource_missing', 'fix_request'],
  [404, 'team_not_accessible', 'drop_team'],
  [409, 'resync_required', 'resync'],
  [409, 'capture_not_ready', 'wait_capture'],
  [410, 'sync_cursor_expired', 'resync'],
]) {
  test(`never retries permanent ${status} ${code}, whose action is ${action}`, async context => {
    assert.ok(Object.hasOwn(contract['x-totem-errors'], code), 'fixture codes come from the published catalogue');
    let count = 0;
    const baseUrl = await serve(context, () => { count++; return { status, body: problem(status, code) }; });
    await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl }).me.get(), error => {
      assert.ok(error instanceof TotemApiError);
      assert.ok(error instanceof TotemError);
      assert.equal(error.status, status);
      assert.equal(error.code, code);
      assert.equal(error.action, action);
      assert.equal(error.title, 'Request refused');
      assert.equal(error.requestId, 'req_fixture_01');
      assert.equal(error.problem.title, 'Request refused');
      return true;
    });
    assert.equal(count, 1);
  });
}
for (const [label, response] of [
  ['an unknown code', Response.json(problem(422, 'brand_new_code'), { status: 422 })],
  ['no problem document', new Response('<html>blocked</html>', { status: 403 })],
]) {
  test(`${label} has no action`, async () => {
    const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: async () => response });
    await assert.rejects(client.me.get(), error => error instanceof TotemApiError && error.action === null);
  });
}
test('the message names status, code and param, never values or problem text', async () => {
  const body = problem(400, 'invalid_request', { title: 'PRIVATE_TITLE', param: 'limit', detail: 'PRIVATE_DETAIL' });
  const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: async () => Response.json(body, { status: 400 }) });
  await assert.rejects(client.leads.list({ limit: 1000 }), error => {
    assert.equal(error.message, 'Totem API request failed (400, invalid_request, param=limit)');
    assert.equal(error.param, 'limit');
    assert.equal(error.title, 'PRIVATE_TITLE');
    return true;
  });
});
test('a param that is not a plain name stays out of the message', async () => {
  const body = problem(400, 'invalid_request', { param: 'limit=1000; tsk_live_secret' });
  const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: async () => Response.json(body, { status: 400 }) });
  await assert.rejects(client.me.get(), error => error.message === 'Totem API request failed (400, invalid_request)' && error.param === 'limit=1000; tsk_live_secret');
});
for (const [label, headers, expected] of [
  ['the Totem-Request-Id header wins over the body', { 'Totem-Request-Id': 'req_header' }, 'req_header'],
  ['the body request_id is used when a proxy strips the header', {}, 'req_body'],
]) {
  test(`request id: ${label}`, async () => {
    const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: async () => Response.json(problem(404, 'resource_missing', { request_id: 'req_body' }), { status: 404, headers }) });
    await assert.rejects(client.me.get(), error => error.requestId === expected);
  });
}
for (const status of [408, 429, 500, 502, 503, 504]) {
  test(`retries transient ${status} within attempt bound`, async context => {
    let count = 0;
    const baseUrl = await serve(context, () => { count++; return count === 1 ? { status, headers: { 'Retry-After': '0' }, body: problem(status, 'service_unavailable') } : { body: { recovered: true } }; });
    assert.deepEqual(await new TotemClient({ apiKey: KEY, baseUrl }).me.get(), { recovered: true });
    assert.equal(count, 2);
  });
}
test('exhausted retry budget surfaces the final problem', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { status: 503, headers: { 'Retry-After': '0' }, body: problem(503, 'service_unavailable') }; });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, maxRetries: 2 }).me.get(), error => error instanceof TotemApiError && error.code === 'service_unavailable');
  assert.equal(count, 3);
});
test('long Retry-After is returned to caller without retrying too soon', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { status: 429, headers: { 'Retry-After': '86400' }, body: problem(429, 'quota_exceeded') }; });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl }).me.get(), error => error instanceof TotemApiError && error.retryAfterMs === 86_400_000 && error.action === 'retry_after');
  assert.equal(count, 1);
});
for (const [label, values, check] of [
  ['delta-seconds', ['7'], ms => ms === 7000],
  ['an IMF-fixdate two minutes ahead, as a delay', [() => new Date(Date.now() + 120_000).toUTCString()], ms => ms >= 110_000 && ms <= 120_000],
  ['a past IMF-fixdate, as zero', ['Thu, 01 Jan 2015 00:00:00 GMT'], ms => ms === 0],
  ['a fraction, ignored', ['1.5'], ms => ms === null],
  ['a negative number, ignored', ['-1'], ms => ms === null],
  ['two merged headers, ignored', ['5', '6'], ms => ms === null],
  ['free text, ignored', ['foo 3'], ms => ms === null],
]) {
  test(`Retry-After: ${label}`, async () => {
    const headers = values.map(value => ['Retry-After', typeof value === 'function' ? value() : value]);
    const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: async () => Response.json(problem(429, 'rate_limited'), { status: 429, headers }) });
    await assert.rejects(client.me.get(), error => error instanceof TotemApiError && check(error.retryAfterMs));
  });
}
test('maxRetryDelayMs caps only the server Retry-After, not the SDK backoff', async () => {
  let count = 0;
  const responses = [() => { throw new TypeError('network unavailable'); }, () => new Response(null, { status: 502 }), () => Response.json({ recovered: true })];
  const client = new TotemClient({ apiKey: KEY, maxRetryDelayMs: 0, fetch: async () => responses[count++]() });
  assert.deepEqual(await client.me.get(), { recovered: true });
  assert.equal(count, 3);
  let limited = 0;
  const strict = new TotemClient({ apiKey: KEY, maxRetryDelayMs: 0, fetch: async () => { limited++; return Response.json(problem(429, 'rate_limited'), { status: 429, headers: { 'Retry-After': '1' } }); } });
  await assert.rejects(strict.me.get(), error => error instanceof TotemApiError && error.retryAfterMs === 1000);
  assert.equal(limited, 1);
});
test('the SDK backoff has equal jitter; a server Retry-After is waited out exactly', async context => {
  context.mock.method(Math, 'random', () => 0);
  const times = [];
  const answers = [new Response(null, { status: 503 }), Response.json(problem(429, 'rate_limited'), { status: 429, headers: { 'Retry-After': '1' } }), Response.json({ recovered: true })];
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { times.push(performance.now()); return answers[times.length - 1]; } });
  assert.deepEqual(await client.me.get(), { recovered: true });
  const [backoff, serverDelay] = [times[1] - times[0], times[2] - times[1]];
  // First step 250 ms: half fixed (125) plus random(0) times the other half.
  assert.ok(backoff >= 120 && backoff < 240, `backoff ${backoff}`);
  assert.ok(serverDelay >= 990, `server delay ${serverDelay}`);
});
test('non-JSON firewall errors retain HTTP status and request id', async () => {
  const client = new TotemClient({ apiKey: KEY, maxRetries: 0, fetch: async () => new Response('<html>blocked</html>', { status: 429, headers: { 'Totem-Request-Id': 'edge_01' } }) });
  await assert.rejects(client.me.get(), error => error instanceof TotemApiError && error.code === 'http_error' && error.status === 429 && error.requestId === 'edge_01');
});
test('success metadata can be read without changing the body shape', async context => {
  const baseUrl = await serve(context, () => ({ body: { name: 'SDK integration' } }));
  const result = await new TotemClient({ apiKey: KEY, baseUrl }).requestWithResponse('me.get');
  assert.deepEqual(result.data, { name: 'SDK integration' });
  assert.equal(result.status, 200);
  assert.equal(result.requestId, 'req_fixture_01');
});
test('invalid successful JSON is a protocol error with its cause and no retry', async () => {
  let count = 0;
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return new Response('not JSON', { status: 200, headers: { 'Totem-Request-Id': 'req_invalid_json' } }); } });
  await assert.rejects(client.me.get(), error => error instanceof TotemProtocolError && error instanceof TotemError && error.requestId === 'req_invalid_json' && error.cause instanceof SyntaxError);
  assert.equal(count, 1);
});
test('network transport failures retry within the same bound', async () => {
  let count = 0;
  const client = new TotemClient({ apiKey: KEY, maxRetries: 1, fetch: async () => { count++; if (count === 1) throw new TypeError('network unavailable'); return Response.json(list); } });
  assert.deepEqual(await client.calls.list(), list);
  assert.equal(count, 2);
});
test('exhausted network retries raise TotemConnectionError carrying the last failure', async context => {
  context.mock.method(Math, 'random', () => 0);
  const failures = [];
  const client = new TotemClient({ apiKey: KEY, maxRetries: 2, fetch: async () => { const failure = new TypeError('fetch failed'); failures.push(failure); throw failure; } });
  await assert.rejects(client.me.get(), error => error instanceof TotemConnectionError && error instanceof TotemError && error.cause === failures.at(-1));
  assert.equal(failures.length, 3);
});
test('an error a custom fetch throws that is not a network failure is rethrown unchanged', async () => {
  let count = 0;
  const bug = new RangeError('instrumentation bug');
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; throw bug; } });
  await assert.rejects(client.me.get(), error => error === bug);
  assert.equal(count, 1);
});
