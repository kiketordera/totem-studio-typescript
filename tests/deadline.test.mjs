/**
 * Contract: `timeoutMs` is one deadline per request covering attempts, retry
 * waits and body reading, and it holds even when a custom fetch or body
 * ignores the signal. A retry wait that cannot finish before the deadline is
 * not started: the error that caused it is returned at once. A connection
 * reset mid-body is a retried network failure on a success, while an error
 * response whose body is lost keeps its status. A caller's abort reason is
 * rethrown unchanged, never wrapped.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { TotemApiError, TotemClient, TotemConnectionError, TotemTimeoutError } from '../dist/index.js';
import { KEY, problem, serve, serveRaw } from './helpers.mjs';

test('a Retry-After longer than the time left returns the 429 at once', async context => {
  let count = 0;
  const baseUrl = await serve(context, () => { count++; return { status: 429, headers: { 'Retry-After': '2' }, body: problem(429, 'rate_limited') }; });
  const started = performance.now();
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, timeoutMs: 1000 }).me.get(), error => {
    assert.ok(error instanceof TotemApiError, `got ${error?.name}`);
    assert.equal(error.code, 'rate_limited');
    assert.equal(error.retryAfterMs, 2000);
    assert.equal(error.requestId, 'req_fixture_01');
    return true;
  });
  assert.ok(performance.now() - started < 500);
  assert.equal(count, 1);
});
test('a network backoff longer than the time left returns the connection error at once', async () => {
  let count = 0;
  const failure = new TypeError('fetch failed');
  const started = performance.now();
  // The first backoff is at least 125 ms; only 100 ms are left.
  const client = new TotemClient({ apiKey: KEY, timeoutMs: 100, fetch: async () => { count++; throw failure; } });
  await assert.rejects(client.me.get(), error => error instanceof TotemConnectionError && error.cause === failure);
  assert.ok(performance.now() - started < 90);
  assert.equal(count, 1);
});
test('the deadline covers a retry that fits and then stalls', { timeout: 5000 }, async context => {
  context.mock.method(Math, 'random', () => 0);
  let count = 0;
  const baseUrl = await serveRaw(context, (_request, response) => {
    if (++count === 1) { response.writeHead(503, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(problem(503, 'service_unavailable'))); }
    // The second attempt never answers.
  });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, timeoutMs: 600 }).me.get(), error => error instanceof TotemTimeoutError && error.timeoutMs === 600);
  assert.equal(count, 2);
});
for (const status of [200, 503]) {
  test(`the deadline aborts a ${status} body that stalls after its headers`, { timeout: 5000 }, async context => {
    const baseUrl = await serveRaw(context, (_request, response) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.write('{"a":'); });
    await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, timeoutMs: 300, maxRetries: 0 }).me.get(), error => error instanceof TotemTimeoutError && error.timeoutMs === 300);
  });
}
test('a per-request timeoutMs overrides the client default', { timeout: 5000 }, async context => {
  const baseUrl = await serveRaw(context, (_request, response) => { response.writeHead(200, { 'Content-Type': 'application/json' }); response.write('{"a":'); });
  const started = performance.now();
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, timeoutMs: 60_000 }).me.get({ timeoutMs: 200 }), error => error instanceof TotemTimeoutError && error.timeoutMs === 200);
  assert.ok(performance.now() - started < 1000);
});
for (const [label, fetch] of [
  ['a fetch', () => new Promise(() => {})],
  ['a body stream', async () => new Response(new ReadableStream({ start() {} }), { status: 200 })],
]) {
  test(`the deadline holds when ${label} ignores the signal`, { timeout: 3000 }, async () => {
    const started = performance.now();
    await assert.rejects(new TotemClient({ apiKey: KEY, timeoutMs: 100, fetch }).me.get(), error => error instanceof TotemTimeoutError && error.timeoutMs === 100);
    assert.ok(performance.now() - started < 1000);
  });
}
test('a connection reset mid-body is retried as a network failure', async context => {
  let count = 0;
  const baseUrl = await serveRaw(context, (_request, response) => {
    if (++count === 1) {
      response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': '200' });
      response.write('{"object":"li');
      setTimeout(() => response.socket.destroy(), 20);
      return;
    }
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ recovered: true }));
  });
  assert.deepEqual(await new TotemClient({ apiKey: KEY, baseUrl }).me.get(), { recovered: true });
  assert.equal(count, 2);
});
test('a reset body with no retries left is a TotemConnectionError, not invalid JSON', async context => {
  const baseUrl = await serveRaw(context, (_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': '200' });
    response.write('{"object":"li');
    setTimeout(() => response.socket.destroy(), 20);
  });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, maxRetries: 0 }).me.get(), error => error instanceof TotemConnectionError && error.cause instanceof TypeError);
});
test('a 503 whose body is reset keeps its status and is retried by status', async context => {
  context.mock.method(Math, 'random', () => 0);
  let count = 0;
  const baseUrl = await serveRaw(context, (_request, response) => {
    count++;
    response.writeHead(503, { 'Content-Type': 'application/json', 'Content-Length': '200' });
    response.write('{"type":"htt');
    setTimeout(() => response.socket.destroy(), 20);
  });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl, maxRetries: 1 }).me.get(), error => {
    assert.ok(error instanceof TotemApiError, `got ${error?.name}`);
    assert.deepEqual([error.status, error.code, error.problem], [503, 'http_error', null]);
    return true;
  });
  assert.equal(count, 2);
});
test('explicit abort cancels in-flight HTTP with no retry and keeps the reason', async context => {
  let count = 0;
  let received;
  const started = new Promise(resolve => { received = resolve; });
  const baseUrl = await serve(context, async () => { count++; received(); await new Promise(resolve => setTimeout(resolve, 60)); return {}; });
  const abort = new AbortController();
  const request = new TotemClient({ apiKey: KEY, baseUrl }).me.get({ signal: abort.signal });
  await started;
  const reason = new Error('caller stopped');
  abort.abort(reason);
  await assert.rejects(request, error => error === reason);
  assert.equal(count, 1);
});
test('already aborted signal never sends a request and keeps the reason', async () => {
  let count = 0;
  const reason = new Error('stop before sending');
  const client = new TotemClient({ apiKey: KEY, fetch: async () => { count++; return Response.json({}); } });
  await assert.rejects(client.me.get({ signal: AbortSignal.abort(reason) }), error => error === reason);
  assert.equal(count, 0);
});
test('a caller AbortSignal.timeout surfaces as its own TimeoutError, not the SDK deadline', async context => {
  const baseUrl = await serve(context, async () => { await new Promise(resolve => setTimeout(resolve, 200)); return {}; });
  await assert.rejects(new TotemClient({ apiKey: KEY, baseUrl }).me.get({ signal: AbortSignal.timeout(50) }), error => error.name === 'TimeoutError' && !(error instanceof TotemTimeoutError));
});
