/** Deterministic OpenAPI 3.1 → TypeScript for Totem's JSON Schema contract. */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const source = await readFile(new URL('../openapi.json', import.meta.url), 'utf8');
const document = JSON.parse(source);
if (document.info['x-totem-pending-components']?.length) throw new Error('Cannot generate an incomplete API');
const hash = createHash('sha256').update(source).digest('hex');
const quote = JSON.stringify;
const annotations = new Set(['description', 'examples', 'example', 'format', 'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'default', 'deprecated', 'title']);
const structural = new Set(['$ref', 'type', 'properties', 'required', 'additionalProperties', 'items', 'anyOf', 'oneOf', 'allOf', 'enum', 'const']);
function type(schema) {
  if (schema === true) return 'unknown';
  if (schema === false) return 'never';
  if (!schema || typeof schema !== 'object') throw new Error('Invalid schema');
  for (const key of Object.keys(schema)) {
    if (!structural.has(key) && !annotations.has(key) && !key.startsWith('x-')) throw new Error(`Unsupported JSON Schema keyword ${key}`);
  }
  const parts = [];
  if (schema.$ref) {
    const prefix = '#/components/schemas/';
    if (!schema.$ref.startsWith(prefix)) throw new Error(`Unsupported ref ${schema.$ref}`);
    const name = schema.$ref.slice(prefix.length);
    if (!document.components.schemas[name]) throw new Error(`Unresolved ref ${schema.$ref}`);
    parts.push(`Schemas[${quote(name)}]`);
  }
  for (const key of ['anyOf', 'oneOf', 'allOf']) {
    if (schema[key]) {
      const union = `(${schema[key].map(type).join(key === 'allOf' ? ' & ' : ' | ')})`;
      parts.push(key !== 'allOf' && schema[key].every(branch => branch.type === 'object') ? `ExclusiveUnion<${union}>` : union);
    }
  }
  if (Object.hasOwn(schema, 'const')) parts.push(quote(schema.const));
  else if (schema.enum) parts.push(`(${schema.enum.map(quote).join(' | ')})`);
  else if (Array.isArray(schema.type)) parts.push(`(${schema.type.map(value => type({ ...schema, type: value })).join(' | ')})`);
  else if (schema.type === 'object' || schema.properties) {
    const required = new Set(schema.required ?? []);
    const fields = Object.entries(schema.properties ?? {}).map(([key, value]) => {
      const comment = value.description ? `/** ${value.description.replaceAll('*/', '* /')} */\n` : '';
      return `${comment}${quote(key)}${required.has(key) ? '' : '?'}: ${type(value)}`;
    });
    if (schema.additionalProperties) fields.push(`[key: string]: ${schema.additionalProperties === true ? 'unknown' : type(schema.additionalProperties)}`);
    parts.push(`{\n${fields.join(';\n')}\n}`);
  }
  else if (schema.type === 'array') parts.push(`Array<${type(schema.items ?? {})}>`);
  else if (schema.type === 'integer' || schema.type === 'number') parts.push('number');
  else if (['string', 'boolean', 'null'].includes(schema.type)) parts.push(schema.type);
  else if (schema.type) throw new Error(`Unsupported schema type ${schema.type}`);
  return parts.join(' & ') || 'unknown';
}
const operations = {};
const contracts = [];
for (const [path, item] of Object.entries(document.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    if (!operation.operationId) continue;
    const parameters = (operation.parameters ?? []).map(param => param.$ref ? document.components.parameters[param.$ref.split('/').at(-1)] : param);
    const parameterType = location => type({ type: 'object', properties: Object.fromEntries(parameters.filter(param => param.in === location).map(param => [param.name, param.schema])), required: parameters.filter(param => param.in === location && param.required).map(param => param.name) });
    const id = operation.operationId;
    operations[id] = { method: method.toUpperCase(), path, authenticated: operation.security?.length !== 0, body: Boolean(operation.requestBody), team: operation['x-totem-tenant-binding'] === 'team_header', query: parameters.filter(param => param.in === 'query').map(param => param.name) };
    contracts.push(`${quote(id)}: { response: ${type(operation.responses['200'].content['application/json'].schema)}; query: ${parameterType('query')}; path: ${parameterType('path')}; body: ${operation.requestBody ? type(operation.requestBody.content['application/json'].schema) : 'never'} }`);
  }
}
const outputs = {
  'schema.ts': `/** Generated from openapi.json. Do not edit; run npm run generate. */\ntype UnionKeys<T> = T extends unknown ? keyof T : never\ntype ExclusiveUnion<T, All = T> = T extends unknown ? T & Partial<Record<Exclude<UnionKeys<All>, keyof T>, never>> : never\nexport interface Schemas {\n${Object.entries(document.components.schemas).map(([name, schema]) => `${quote(name)}: ${type(schema)}`).join(';\n')}\n}\nexport interface OperationContracts {\n${contracts.join(';\n')}\n}\n`,
  'operations.ts': `/** Generated from openapi.json. Do not edit. */\nexport const CONTRACT_SHA256 = '${hash}'\nexport const DEFAULT_BASE_URL = '${document.servers[0].url}'\nexport const operationDefinitions = ${JSON.stringify(operations, null, 2)} as const\n`,
};
for (const [file, content] of Object.entries(outputs)) {
  const path = new URL(`../src/generated/${file}`, import.meta.url);
  if (process.argv.includes('--check')) {
    if (await readFile(path, 'utf8').catch(() => '') !== content) throw new Error(`Generated ${file} differs; run npm run generate`);
  } else await writeFile(path, content);
}
console.log(`OpenAPI ${document.info.version}: ${Object.keys(operations).length} operations, SHA-256 ${hash}`);
