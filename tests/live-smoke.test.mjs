/** Contract: live verification validates response boundaries and emits only closed diagnostics, never keys or record contents. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ResponseValidationError, validateResponse } from '../scripts/schema-validation.mjs';
import { KEY, serve } from './helpers.mjs';

const doc = { components: { schemas: { Name: { type: 'string', minLength: 2 } } } };
for (const [label, schema, value, code] of [
  ['forbidden field', { type: 'object', properties: { id: { type: 'string' } }, additionalProperties: false }, { id: 'lead_1', privateContent: 'sensitive' }, 'additional_property'],
  ['short array', { type: 'array', minItems: 2 }, [1], 'min_items'],
  ['long array', { type: 'array', maxItems: 1 }, [1, 2], 'max_items'],
  ['false schema', false, 'sensitive', 'schema_false'],
  ['unresolved reference', { $ref: '#/components/schemas/Missing' }, 'sensitive', 'schema_reference'],
  ['unsupported constraint', { type: 'number', multipleOf: 2 }, 3, 'schema_unsupported'],
  ['const mismatch', { const: 'lead' }, 'sensitive', 'const'],
  ['required missing', { type: 'object', required: ['id'] }, {}, 'required'],
  ['number bound', { type: 'integer', maximum: 3 }, 4, 'maximum'],
]) {
  test(`response validator rejects ${label} without echoing values`, () => {
    assert.throws(() => validateResponse(value, schema, doc), error => {
      assert.ok(error instanceof ResponseValidationError);
      assert.equal(error.code, code);
      assert.equal(error.message, 'API response did not match its declared schema');
      assert.equal(error.message.includes('sensitive'), false);
      return true;
    });
  });
}
test('validator resolves refs, nullable unions and Unicode codepoint lengths', () => {
  validateResponse({ name: 'Al', values: [null, 'ok'] }, { type: 'object', required: ['name', 'values'], properties: { name: { $ref: '#/components/schemas/Name' }, values: { type: 'array', items: { anyOf: [{ type: 'null' }, { type: 'string' }] } } }, additionalProperties: false }, doc);
  validateResponse('🙂', { type: 'string', maxLength: 1 }, doc);
  validateResponse({ anything: true }, true, doc);
});
async function runSmoke(context, handler) {
  const directory = await mkdtemp(join(tmpdir(), 'totem-sdk-live-test-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const keyFile = join(directory, 'smoke.key');
  const receiptFile = join(directory, 'receipt.json');
  await writeFile(keyFile, KEY, { mode: 0o600 });
  const baseUrl = await serve(context, handler);
  const child = spawn(process.execPath, ['scripts/live-smoke.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, TOTEM_API_KEY: '', TOTEM_API_KEY_FILE: keyFile, TOTEM_TEAM_ID: '', TOTEM_LIVE_FIXTURES_FILE: '', TOTEM_API_BASE_URL: baseUrl, TOTEM_SMOKE_RECEIPT: receiptFile }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const exitCode = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
  const receiptText = await readFile(receiptFile, 'utf8');
  assert.equal(output.includes(KEY), false);
  assert.equal(receiptText.includes(KEY), false);
  return { exitCode, output, receipt: JSON.parse(receiptText), receiptText };
}
test('malformed response values never appear in live logs or receipt', async context => {
  const result = await runSmoke(context, () => ({ headers: { 'Totem-Request-Id': 'req_12345678-1234-4234-8234-123456789abc' }, body: { object: 'PRIVATE_CUSTOMER_RECORD_VALUE', status: 'ok' } }));
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.includes('PRIVATE_CUSTOMER_RECORD_VALUE'), false);
  assert.equal(result.receiptText.includes('PRIVATE_CUSTOMER_RECORD_VALUE'), false);
  assert.deepEqual(result.receipt.failure, { code: 'response_schema_mismatch', status: null, apiCode: null, requestId: null });
});
test('provider problem messages and malicious request ids never reach diagnostics', async context => {
  const result = await runSmoke(context, () => ({ status: 503, headers: { 'Totem-Request-Id': KEY }, body: { type: 'private-provider-error', title: 'PRIVATE_PROVIDER_MESSAGE', status: 503, code: 'private_provider_message', request_id: KEY, doc_url: 'private-value' } }));
  assert.equal(result.exitCode, 1);
  assert.equal(result.output.includes('PRIVATE_PROVIDER_MESSAGE'), false);
  assert.equal(result.receiptText.includes('PRIVATE_PROVIDER_MESSAGE'), false);
  assert.deepEqual(result.receipt.failure, { code: 'api_error', status: 503, apiCode: null, requestId: null });
});
test('live runner covers all 18 operations and negative cases against a strict HTTP fixture', async context => {
  const document = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
  const result = await runSmoke(context, request => {
    const headers = { 'Totem-Request-Id': 'req_12345678-1234-4234-8234-123456789abc' };
    const url = new URL(request.url, 'http://localhost');
    const error = (status, code) => ({ status, headers, body: { type: `https://totemstudio.ai/developers/errors#${code}`, title: 'Request refused', status, code, request_id: 'req_12345678-1234-4234-8234-123456789abc', doc_url: `https://totemstudio.ai/developers/errors#${code}` } });
    if (url.pathname !== '/v1/health' && request.headers.authorization !== `Bearer ${KEY}`) return error(401, 'invalid_credentials');
    if (url.searchParams.get('limit') === '0') return error(400, 'invalid_request');
    if (url.pathname === '/v1/leads/search' && request.body === '{}') return error(400, 'invalid_request');
    for (const [path, methods] of Object.entries(document.paths)) {
      if (!new RegExp(`^/v1${path.replace('{id}', '[^/]+')}$`).test(url.pathname)) continue;
      const operation = methods[request.method.toLowerCase()];
      if (operation) return { headers, body: operation.responses['200'].content['application/json'].example };
    }
    return error(404, 'resource_missing');
  });
  assert.equal(result.exitCode, 0, result.output);
  assert.equal(result.receipt.passed, true);
  assert.equal(result.receipt.coveredOperations.length, 18);
  assert.equal(result.receipt.checks.length, 22);
  assert.equal(result.receipt.failure, null);
});
