/**
 * Contract: generate(document, { version, sha256 }) translates each supported
 * OpenAPI construct faithfully (docs, open response enums, closed request
 * enums and discriminators, nullable cursors, security, tenant binding, error
 * catalogue) and throws a GeneratorError for every construct it cannot
 * translate, instead of emitting a weaker type. Fixtures are minimal
 * documents, one per construct.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GeneratorError, generate } from '../scripts/generate.mjs';

const options = { version: '1.2.3-beta.4', sha256: 'a'.repeat(64) };
const ok200 = schema => ({ '200': { description: 'OK', content: { 'application/json': { schema } } } });
function fixture() {
  return {
    openapi: '3.1.0',
    info: { title: 'Fixture', version: 'test' },
    servers: [{ url: 'https://api.example.invalid/v1' }],
    security: [{ secretKey: [] }],
    'x-totem-errors': {
      invalid_request: { status: 400, action: 'fix_request', doc_url: 'https://docs.example.invalid/errors#invalid_request', description: 'Something in the request is wrong.' },
      resync_required: { status: 409, action: 'resync', doc_url: 'https://docs.example.invalid/errors#resync_required' },
    },
    components: {
      parameters: { Team: { name: 'Totem-Team', in: 'header', schema: { type: 'string' } } },
      schemas: {
        Thing: { type: 'object', description: 'A thing.', properties: { id: { type: 'string', description: 'The id.' }, state: { type: 'string', enum: ['a', 'b'] }, note: { type: ['string', 'null'] } }, required: ['id', 'state'] },
      },
    },
    paths: {
      '/things': {
        get: {
          operationId: 'things.list', summary: 'List things', description: 'Lists every thing.', 'x-totem-tenant-binding': 'team_header',
          parameters: [{ name: 'limit', in: 'query', description: 'Items per page', schema: { type: 'integer' } }, { name: 'state', in: 'query', schema: { type: 'string', enum: ['a', 'b'] } }, { $ref: '#/components/parameters/Team' }],
          responses: ok200({ $ref: '#/components/schemas/Thing' }),
        },
      },
      '/things/{id}': { get: { operationId: 'things.get', 'x-totem-tenant-binding': 'resource_id', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: ok200({ $ref: '#/components/schemas/Thing' }) } },
      '/health': { get: { operationId: 'health', 'x-totem-tenant-binding': 'none', security: [], responses: ok200({ type: 'object', properties: { status: { const: 'ok' } } }) } },
    },
  };
}
const thing = document => document.components.schemas.Thing;
const list = document => document.paths['/things'].get;

for (const [label, mutate, message] of [
  ['a type array with properties', document => { thing(document).type = ['object', 'null']; }, /type array cannot be combined with properties/],
  ['required naming an absent property', document => { thing(document).required.push('missing'); }, /required names missing/],
  ['an empty closed object', document => { document.components.schemas.Thing = { type: 'object', additionalProperties: false }; }, /empty closed object/],
  ['an unsupported keyword', document => { thing(document).properties.id.multipleOf = 2; }, /Unsupported JSON Schema keyword multipleOf/],
  ['an unresolved reference', document => { list(document).responses = ok200({ $ref: '#/components/schemas/Missing' }); }, /Unresolved ref/],
  ['path-item parameters', document => { document.paths['/things'].parameters = [{ name: 'q', in: 'query', schema: { type: 'string' } }]; }, /Path-level parameters/],
  ['a path-item $ref', document => { document.paths['/things'].$ref = '#/paths/~1other'; }, /Path item \$ref/],
  ['an operation without operationId', document => { delete list(document).operationId; }, /has no operationId/],
  ['a cookie parameter', document => { list(document).parameters.push({ name: 'session', in: 'cookie', schema: { type: 'string' } }); }, /cookie parameters/],
  ['a header other than Totem-Team', document => { list(document).parameters.push({ name: 'X-Trace', in: 'header', schema: { type: 'string' } }); }, /only Totem-Team/],
  ['Totem-Team on an operation not bound to it', document => { list(document)['x-totem-tenant-binding'] = 'resource_id'; }, /only Totem-Team/],
  ['an unknown tenant binding', document => { document.paths['/things/{id}'].get['x-totem-tenant-binding'] = 'team_query'; }, /x-totem-tenant-binding "team_query" is not one of/],
  ['a missing tenant binding', document => { delete document.paths['/things/{id}'].get['x-totem-tenant-binding']; }, /x-totem-tenant-binding undefined is not one of/],
  ['a team_header operation without the Totem-Team header', document => { list(document).parameters.pop(); }, /must declare the Totem-Team header/],
  ['an array query parameter', document => { list(document).parameters.push({ name: 'ids', in: 'query', schema: { type: 'array', items: { type: 'string' } } }); }, /only scalar query values/],
  ['an optional path parameter', document => { document.paths['/things/{id}'].get.parameters[0].required = false; }, /must be required/],
  ['a path template with no parameter', document => { document.paths['/things/{id}'].get.parameters = []; }, /names \{id\} with no path parameter/],
  ['a missing 200 response', document => { list(document).responses = { default: { description: 'Error' } }; }, /needs an inline 200 response/],
  ['a non-JSON 200 response', document => { list(document).responses = { '200': { description: 'CSV', content: { 'text/csv': { schema: { type: 'string' } } } } }; }, /one application\/json schema/],
  ['another success status', document => { list(document).responses['201'] = { description: 'Created' }; }, /success status 201/],
  ['an optional request body', document => { list(document).requestBody = { content: { 'application/json': { schema: { type: 'object', properties: { q: { type: 'string' } } } } } }; }, /optional requestBody/],
  ['a request body behind a $ref', document => { list(document).requestBody = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Thing' } } } }; }, /Request schemas must be inline/],
  ['a component named like an SDK export', document => { document.components.schemas.TotemClient = { type: 'string' }; }, /collides with an SDK export/],
  ['a union discriminator behind a $ref', document => {
    list(document).responses = ok200({ oneOf: [{ $ref: '#/components/schemas/Thing' }, { type: 'object', properties: { state: { const: 'c' } } }] });
  }, /discriminator state is behind/],
  ['a numeric response enum, which cannot be opened', document => { thing(document).properties.state = { type: 'integer', enum: [1, 2] }; }, /only strings/],
  ['no error catalogue', document => { delete document['x-totem-errors']; }, /x-totem-errors/],
  ['pending components', document => { document.info['x-totem-pending-components'] = ['Thing']; }, /incomplete API/],
]) {
  test(`refuses ${label}`, () => {
    const document = fixture();
    mutate(document);
    assert.throws(() => generate(document, options), error => error instanceof GeneratorError && message.test(error.message));
  });
}

test('emits parameter, component and operation descriptions as JSDoc', () => {
  const { 'schema.ts': schema } = generate(fixture(), options);
  assert.ok(schema.includes('/** Items per page */\n"limit"?: number | null | undefined'));
  assert.ok(schema.includes('/** A thing. */\n"Thing": {'));
  assert.ok(schema.includes('/** The id. */\n"id": string'));
  assert.ok(schema.includes('/**\n * List things\n *\n * Lists every thing.\n */\n"things.list": {'));
  assert.ok(schema.includes('/** A thing. */\nexport type Thing = Schemas["Thing"]'));
});
test('response enums are open, request enums closed, nullable type arrays kept', () => {
  const { 'schema.ts': schema } = generate(fixture(), options);
  assert.ok(schema.includes('"state": (("a" | "b") | (string & {}))'));
  assert.ok(schema.includes('"state"?: ("a" | "b") | null | undefined'));
  assert.ok(schema.includes('"note"?: (string | null)'));
});
const definitions = output => JSON.parse(output.slice(output.indexOf('operationDefinitions = ') + 23, output.indexOf(' as const\n')));
test('authentication follows operation security, else document security; only team_header sends Totem-Team', () => {
  const document = fixture();
  const generated = definitions(generate(document, options)['operations.ts']);
  assert.deepEqual([generated['things.list'].authenticated, generated['things.list'].team, generated['things.get'].team, generated.health.authenticated], [true, true, false, false]);
  document.security = [];
  assert.equal(definitions(generate(document, options)['operations.ts'])['things.get'].authenticated, false);
});
test('emits the version, contract hash and error catalogue', () => {
  const { 'schema.ts': schema, 'operations.ts': operations } = generate(fixture(), options);
  assert.ok(operations.includes(`export const SDK_VERSION = '1.2.3-beta.4'`));
  assert.ok(operations.includes(`export const CONTRACT_SHA256 = '${'a'.repeat(64)}'`));
  assert.ok(operations.includes('"resync_required": { status: 409, action: "resync", docUrl: "https://docs.example.invalid/errors#resync_required" }'));
  assert.ok(schema.includes('export type TotemErrorCode = "invalid_request" | "resync_required"'));
  assert.ok(schema.includes('export type ErrorAction = "fix_request" | "resync"'));
});
test('the real contract generates, with Problem.code open over the catalogue', async () => {
  const document = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
  const { 'schema.ts': schema, 'operations.ts': operations } = generate(document, options);
  assert.ok(schema.includes('"code": (TotemErrorCode | (string & {}))'));
  assert.ok(operations.includes('"capture_not_ready": { status: 409, action: "wait_capture", docUrl: "https://totemstudio.ai/developers/errors#capture_not_ready" }'));
});
test('generated types compile and behave: open responses, closed discriminators and requests', async context => {
  const document = fixture();
  document.components.schemas.Event = { oneOf: [
    { type: 'object', properties: { type: { type: 'string', enum: ['created', 'deleted'] }, actor: { type: 'string', enum: ['human', 'ai'] } }, required: ['type', 'actor'] },
    { type: 'object', properties: { type: { const: 'moved' }, actor: { type: 'string', enum: ['human', 'ai'] }, to: { type: 'string' } }, required: ['type', 'actor', 'to'] },
  ] };
  const directory = await mkdtemp(join(tmpdir(), 'totem-sdk-generator-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  for (const [file, content] of Object.entries(generate(document, options))) await writeFile(join(directory, file), content);
  await writeFile(join(directory, 'probe.ts'), `import type { Event, OperationContracts, Thing } from './schema.js'
declare const event: Event
const future: Thing['state'] = 'grown_later'
const actor: Event['actor'] = 'robot'
if (event.type === 'moved') { const to: string = event.to; void to }
// @ts-expect-error discriminators stay closed
const unknownType: Event['type'] = 'grown_later'
// @ts-expect-error request enums stay closed
const filter: OperationContracts['things.list']['query']['state'] = 'grown_later'
const cursor: OperationContracts['things.list']['query'] = { limit: null, state: undefined }
void future; void actor; void unknownType; void filter; void cursor
`);
  await writeFile(join(directory, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true, exactOptionalPropertyTypes: true, noEmit: true, module: 'NodeNext', moduleResolution: 'NodeNext', target: 'ES2023', skipLibCheck: true }, include: ['*.ts'] }));
  const tsc = new URL('../node_modules/typescript/bin/tsc', import.meta.url);
  try { execFileSync(process.execPath, [tsc.pathname.replaceAll('%20', ' '), '-p', directory], { stdio: 'pipe' }); }
  catch (error) { assert.fail(String(error.stdout)); }
});
