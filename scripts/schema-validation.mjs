/**
 * Runtime JSON Schema checks for the live receipt. Errors carry a closed code
 * and a path built only from schema names, array indexes and `.*`, never a
 * record value or an undeclared key. `closed: true` (used only by the live
 * smoke) treats every object that declares properties as closed, because the
 * published response schemas are open for forward compatibility.
 */
import { isDeepStrictEqual } from 'node:util';

export const VALIDATION_CODES = new Set(['schema_false', 'schema_invalid', 'schema_unsupported', 'schema_reference', 'anyOf', 'oneOf', 'allOf', 'const', 'enum', 'type', 'pattern', 'min_length', 'max_length', 'date_time', 'minimum', 'maximum', 'min_items', 'max_items', 'required', 'additional_property', 'undeclared_field']);
export class ResponseValidationError extends Error {
  constructor(code, path) {
    super('API response did not match its declared schema');
    this.name = 'ResponseValidationError';
    this.code = code;
    this.path = path;
  }
}
const annotations = new Set(['description', 'examples', 'example', 'format', 'default', 'deprecated', 'title']);
const supported = new Set(['$ref', 'type', 'properties', 'required', 'additionalProperties', 'items', 'anyOf', 'oneOf', 'allOf', 'enum', 'const', 'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems']);
const fail = (code, path) => { throw new ResponseValidationError(code, path); };

export function validateResponse(value, schema, document, { closed = false } = {}) {
  check(value, schema, '$');
  function check(value, schema, path) {
    if (schema === true) return;
    if (schema === false) fail('schema_false', path);
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) fail('schema_invalid', path);
    for (const key of Object.keys(schema)) {
      if (!supported.has(key) && !annotations.has(key) && !key.startsWith('x-')) fail('schema_unsupported', path);
    }
    if (schema.$ref) {
      const prefix = '#/components/schemas/';
      if (!schema.$ref.startsWith(prefix)) fail('schema_reference', path);
      const target = document.components?.schemas?.[schema.$ref.slice(prefix.length)];
      if (target === undefined) fail('schema_reference', path);
      check(value, target, path);
    }
    for (const combinator of ['anyOf', 'oneOf', 'allOf']) {
      if (!schema[combinator]) continue;
      const valid = schema[combinator].filter(branch => {
        try { check(value, branch, path); return true; }
        catch (error) {
          // A broken schema inside a branch is a contract defect, not a non-matching branch.
          if (!(error instanceof ResponseValidationError) || error.code.startsWith('schema_') && error.code !== 'schema_false') throw error;
          return false;
        }
      }).length;
      if (!(combinator === 'allOf' ? valid === schema[combinator].length : combinator === 'oneOf' ? valid === 1 : valid >= 1)) fail(combinator, path);
    }
    if (Object.hasOwn(schema, 'const') && !isDeepStrictEqual(value, schema.const)) fail('const', path);
    if (schema.enum && !schema.enum.some(variant => isDeepStrictEqual(value, variant))) fail('enum', path);
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      if (!types.some(type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'integer' ? Number.isInteger(value) : type === 'number' ? typeof value === 'number' && Number.isFinite(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : ['string', 'boolean'].includes(type) && typeof value === type)) fail('type', path);
    }
    if (typeof value === 'string') {
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail('pattern', path);
      const length = [...value].length;
      if (schema.minLength !== undefined && length < schema.minLength) fail('min_length', path);
      if (schema.maxLength !== undefined && length > schema.maxLength) fail('max_length', path);
      if (schema.format === 'date-time' && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value)))) fail('date_time', path);
    }
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) fail('minimum', path);
      if (schema.maximum !== undefined && value > schema.maximum) fail('maximum', path);
    }
    if (Array.isArray(value)) {
      if (schema.minItems !== undefined && value.length < schema.minItems) fail('min_items', path);
      if (schema.maxItems !== undefined && value.length > schema.maxItems) fail('max_items', path);
      if (schema.items !== undefined) value.forEach((item, index) => check(item, schema.items, `${path}[${index}]`));
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) fail('required', `${path}.${key}`);
      for (const [key, child] of Object.entries(schema.properties ?? {})) if (Object.hasOwn(value, key)) check(value[key], child, `${path}.${key}`);
      for (const key of Object.keys(value)) {
        if (Object.hasOwn(schema.properties ?? {}, key)) continue;
        // Never include an unknown record key in diagnostic paths.
        if (schema.additionalProperties === false) fail('additional_property', path);
        if (closed && schema.properties && schema.additionalProperties === undefined) fail('undeclared_field', path);
        if (schema.additionalProperties && typeof schema.additionalProperties === 'object') check(value[key], schema.additionalProperties, `${path}.*`);
      }
    }
  }
}
