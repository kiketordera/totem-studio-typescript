import { createServer } from 'node:http';
/** A JSON fixture server. The handler returns { status, headers, body }; every answer carries a request id unless headers override it. */
export async function serve(context, handler) {
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    try {
      const result = await handler({ method: request.method, url: request.url, headers: request.headers, body });
      response.writeHead(result.status ?? 200, { 'Content-Type': 'application/json', 'Totem-Request-Id': 'req_fixture_01', ...result.headers });
      response.end(JSON.stringify(result.body ?? { object: 'list', data: [], has_more: false, next_cursor: null }));
    } catch (error) { response.writeHead(500); response.end(JSON.stringify({ failure: error.message })); }
  });
  return listen(context, server);
}
/** A server whose listener writes the raw response itself: for stalled, truncated or reset bodies. */
export async function serveRaw(context, listener) {
  return listen(context, createServer(listener));
}
async function listen(context, server) {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  context.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  return `http://127.0.0.1:${server.address().port}/v1`;
}
export const KEY = 'tsk_live_fictitious_sdk_test';
export const problem = (status, code, extra = {}) => ({ type: 'https://totemstudio.ai/developers/errors', title: 'Request refused', status, code, request_id: 'req_fixture_01', doc_url: 'https://totemstudio.ai/developers/errors', ...extra });
