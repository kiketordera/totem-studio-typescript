/**
 * Contract: the live receipt's schema validator rejects each rule's violation
 * with that rule's closed code and never echoes a value; in closed-world mode
 * it also rejects undeclared fields without naming them, while every
 * published operation example still passes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ResponseValidationError, VALIDATION_CODES, validateResponse } from '../scripts/schema-validation.mjs';

const doc = { components: { schemas: { Name: { type: 'string', minLength: 2 } } } };
for (const [label, schema, value, code] of [
  ['forbidden field', { type: 'object', properties: { id: { type: 'string' } }, additionalProperties: false }, { id: 'lead_1', privateContent: 'sensitive' }, 'additional_property'],
  ['short array', { type: 'array', minItems: 2 }, ['sensitive'], 'min_items'],
  ['long array', { type: 'array', maxItems: 1 }, ['sensitive', 'sensitive'], 'max_items'],
  ['false schema', false, 'sensitive', 'schema_false'],
  ['unresolved reference', { $ref: '#/components/schemas/Missing' }, 'sensitive', 'schema_reference'],
  ['unresolved reference inside a nullable union, not a failed branch', { anyOf: [{ type: 'null' }, { $ref: '#/components/schemas/Missing' }] }, 'sensitive', 'schema_reference'],
  ['unsupported constraint', { type: 'number', multipleOf: 2 }, 3, 'schema_unsupported'],
  ['const mismatch', { const: 'lead' }, 'sensitive', 'const'],
  ['enum mismatch', { enum: ['a'] }, 'sensitive', 'enum'],
  ['required missing', { type: 'object', required: ['id'] }, {}, 'required'],
  ['number bound', { type: 'integer', maximum: 3 }, 4, 'maximum'],
  ['lower bound', { type: 'integer', minimum: 1 }, 0, 'minimum'],
  ['wrong type', { type: 'string' }, 3, 'type'],
  ['fractional integer', { type: 'integer' }, 1.5, 'type'],
  ['pattern mismatch', { type: 'string', pattern: '^lead_[A-Za-z0-9]+$' }, 'lead_../sensitive', 'pattern'],
  ['impossible date-time', { type: 'string', format: 'date-time' }, '2026-13-45T00:00:00Z', 'date_time'],
  ['free-text date-time', { type: 'string', format: 'date-time' }, 'sensitive yesterday', 'date_time'],
  ['short string', { type: 'string', minLength: 2 }, 's', 'min_length'],
  ['long string', { type: 'string', maxLength: 1 }, 'sensitive', 'max_length'],
  ['oneOf matching two branches', { oneOf: [{ type: 'string' }, { type: 'string' }] }, 'sensitive', 'oneOf'],
  ['anyOf matching no branch', { anyOf: [{ type: 'null' }, { type: 'integer' }] }, 'sensitive', 'anyOf'],
  ['additionalProperties schema mismatch', { type: 'object', additionalProperties: { type: 'string' } }, { key: 1 }, 'type'],
]) {
  test(`response validator rejects ${label} without echoing values`, () => {
    assert.throws(() => validateResponse(value, schema, doc), error => {
      assert.ok(error instanceof ResponseValidationError);
      assert.equal(error.code, code);
      assert.ok(VALIDATION_CODES.has(error.code));
      assert.equal(error.message, 'API response did not match its declared schema');
      assert.equal(`${error.message}${error.path}`.includes('sensitive'), false);
      return true;
    });
  });
}
test('validator resolves refs, nullable unions and Unicode codepoint lengths', () => {
  validateResponse({ name: 'Al', values: [null, 'ok'] }, { type: 'object', required: ['name', 'values'], properties: { name: { $ref: '#/components/schemas/Name' }, values: { type: 'array', items: { anyOf: [{ type: 'null' }, { type: 'string' }] } } }, additionalProperties: false }, doc);
  validateResponse('🙂', { type: 'string', maxLength: 1 }, doc);
  validateResponse({ anything: true }, true, doc);
});
test('closed-world mode rejects an undeclared field at its parent path, without naming it', () => {
  const schema = { type: 'object', properties: { call: { type: 'object', properties: { id: { type: 'string' } } } } };
  const value = { call: { id: 'call_1', PRIVATE_TRANSCRIPT_KEY: 'sensitive' } };
  validateResponse(value, schema, doc);
  assert.throws(() => validateResponse(value, schema, doc, { closed: true }), error => {
    assert.equal(error.code, 'undeclared_field');
    assert.equal(error.path, '$.call');
    return true;
  });
  // A free-form map stays open in closed-world mode.
  validateResponse({ any_key: 'x' }, { type: 'object', additionalProperties: { type: 'string' } }, doc, { closed: true });
});
test('every published operation example passes closed-world validation', async () => {
  const document = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
  let examples = 0;
  for (const methods of Object.values(document.paths)) {
    for (const operation of Object.values(methods)) {
      const content = operation.responses['200'].content['application/json'];
      validateResponse(content.example, content.schema, document, { closed: true });
      examples++;
    }
  }
  assert.ok(examples > 0);
});
