/** Contract: problem errors keep support metadata; retries are bounded and cancellable, and never retry authorization failures. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TotemApiError, TotemClient, TotemProtocolError, TotemTimeoutError } from '../dist/index.js';
import { KEY, problem, serve } from './helpers.mjs';

for (const [status, code] of [[400, 'invalid_request'], [401, 'invalid_credentials'], [403, 'ip_not_allowed'], [404, 'resource_missing'], [410, 'cursor_expired']]) {
  test(`never retries permanent ${status} ${code}`, async context => {
    let count = 0;
    const baseUrl = await serve(context, () => { count++; return { status, body: problem(status, code) }; });
    await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl }).me.get(), error => {
      assert.ok(error instanceof TotemApiError);
      assert.equal(error.status, status);
      assert.equal(error.code, code);
      assert.equal(error.requestId, 'req_fixture_01');
      assert.equal(error.problem.title, 'Request refused');
      return true;
    });
    assert.equal(count, 1);
  });
}
for (const status of [408, 429, 500, 502, 503, 504]) {
  test(`retries transient ${status} within attempt bound`, async context => {
    let count = 0;
    const baseUrl = await serve(context, () => { count++; return count === 1 ? { status, headers: { 'Retry-After': '0' }, body: problem(status, 'temporarily_unavailable') } : { body: { recovered: true } }; });
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
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl }).me.get(), error => error instanceof TotemApiError && error.retryAfterMs === 86_400_000);
  assert.equal(count, 1);
});
test('Retry-After HTTP dates are accepted', async context => {
  const baseUrl = await serve(context, () => ({ status: 429, headers: { 'Retry-After': 'Wed, 01 Jan 2031 00:00:00 GMT' }, body: problem(429, 'rate_limited') }));
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, maxRetryDelayMs: 0 }).me.get(), error => error instanceof TotemApiError && error.retryAfterMs > 86_400_000);
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
test('invalid successful JSON is a protocol error with no retry', async () => {
  let count = 0;
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return new Response('not JSON', { status: 200, headers: { 'Totem-Request-Id': 'req_invalid_json' } }); } });
  await assert.rejects(client.me.get(), error => error instanceof TotemProtocolError && error.requestId === 'req_invalid_json');
  assert.equal(count, 1);
});
test('network transport failures retry within the same bound', async () => {
  let count = 0;
  const client = new TotemClient({ apiKey: KEY, maxRetries: 1, fetch: async () => { count++; if (count === 1) throw new TypeError('network unavailable'); return Response.json({ recovered: true }); } });
  assert.deepEqual(await client.me.get(), { recovered: true });
  assert.equal(count, 2);
});
test('explicit abort cancels in-flight HTTP with no retry', async context => {
  let count = 0;
  let received;
  const started = new Promise(resolve => { received = resolve; });
  const baseUrl = await serve(context, async () => { count++; received(); await new Promise(resolve => setTimeout(resolve, 60)); return {}; });
  const abort = new AbortController();
  const request = new TotemClient({ apiKey: KEY, baseUrl }).me.get({ signal: abort.signal });
  await started;
  abort.abort(new Error('caller stopped'));
  await assert.rejects(request, /caller stopped/);
  assert.equal(count, 1);
});
test('deadline aborts body and waiting retries as one total request budget', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { status: 503, headers: { 'Retry-After': '1' }, body: problem(503, 'service_unavailable') }; });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, timeoutMs: 20 }).me.get(), error => error instanceof TotemTimeoutError && error.timeoutMs === 20);
  assert.equal(count, 1);
});
test('already aborted signal never sends a request', async () => {
  let count = 0;
  const signal = AbortSignal.abort(new Error('stop before sending'));
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return Response.json({}); } });
  await assert.rejects(client.me.get({ signal }), /stop before sending/);
  assert.equal(count, 0);
});
