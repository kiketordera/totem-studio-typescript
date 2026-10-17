/**
 * Deterministic OpenAPI 3.1 → TypeScript for Totem's JSON Schema contract.
 *
 * `generate(document, { version, sha256 })` is pure: it returns the generated
 * files as strings. It fails closed with a GeneratorError on any construct it
 * cannot translate faithfully, instead of emitting a weaker type. Response
 * enums are open (`Known | (string & {})`, conventions.md "Enums can grow"),
 * except union discriminators; request enums stay closed. The CLI at the end
 * writes src/generated, or with --check proves it is up to date.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export class GeneratorError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GeneratorError';
  }
}
const fail = message => { throw new GeneratorError(message); };
const quote = JSON.stringify;
const annotations = new Set(['description', 'examples', 'example', 'format', 'pattern', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'default', 'deprecated', 'title']);
const structural = new Set(['$ref', 'type', 'properties', 'required', 'additionalProperties', 'items', 'anyOf', 'oneOf', 'allOf', 'enum', 'const']);
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
const SCALAR_QUERY_TYPES = new Set(['string', 'integer', 'number']);
/** x-totem-tenant-binding values; only team_header makes the SDK send Totem-Team. */
const TENANT_BINDINGS = new Set(['principal', 'resource_id', 'team_header', 'none']);
/** Hand-written SDK exports; a component alias with one of these names would shadow it. */
const RESERVED = new Set(['TotemClient', 'TotemError', 'TotemApiError', 'TotemProtocolError', 'TotemTimeoutError', 'TotemConnectionError', 'Schemas', 'OperationContracts', 'OperationId', 'ResponseOf', 'QueryOf', 'BodyOf', 'RequestOptions', 'OptionsOf', 'RequestInput', 'RequestArgs', 'ListOperationId', 'ItemsOperationId', 'ItemOf', 'ResponseInfo', 'ClientOptions', 'TotemErrorCode', 'ErrorAction', 'ErrorCatalogueEntry', 'Stage', 'FeedRemoval', 'FeedUpsert', 'FeedObjectOf', 'UnionKeys', 'ExclusiveUnion']);

/** A JSDoc block for English documentation text, or nothing. */
function doc(...texts) {
  const text = texts.filter(value => typeof value === 'string' && value.trim()).join('\n\n').replaceAll('*/', '* /');
  if (!text) return '';
  const lines = text.split('\n');
  return lines.length === 1 ? `/** ${text} */\n` : `/**\n${lines.map(line => ` * ${line}`.trimEnd()).join('\n')}\n */\n`;
}

export function generate(document, { version, sha256 }) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) fail('version must be a semantic version');
  if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256)) fail('sha256 must be a hex SHA-256');
  if (!document || typeof document !== 'object' || !document.paths || !document.components?.schemas) fail('Not an OpenAPI document with paths and components.schemas');
  if (document.info?.['x-totem-pending-components']?.length) fail('Cannot generate an incomplete API');
  const baseUrl = document.servers?.[0]?.url;
  if (typeof baseUrl !== 'string' || !baseUrl.startsWith('https://')) fail('servers[0].url must be an HTTPS URL');
  const schemas = document.components.schemas;
  const errors = document['x-totem-errors'];
  if (!errors || typeof errors !== 'object' || !Object.keys(errors).length) fail('x-totem-errors must list the error catalogue');
  for (const [code, entry] of Object.entries(errors)) {
    if (!/^[a-z0-9_]+$/.test(code)) fail(`Error code ${code} is not a machine code`);
    if (!Number.isInteger(entry?.status) || entry.status < 400 || entry.status > 599) fail(`Error ${code} needs an HTTP error status`);
    if (typeof entry.action !== 'string' || !/^[a-z_]+$/.test(entry.action)) fail(`Error ${code} needs an action`);
    if (typeof entry.doc_url !== 'string' || !entry.doc_url.startsWith('https://')) fail(`Error ${code} needs an HTTPS doc_url`);
  }
  const errorCodes = Object.keys(errors);

  const resolve = ref => {
    const prefix = '#/components/schemas/';
    if (typeof ref !== 'string' || !ref.startsWith(prefix)) fail(`Unsupported ref ${ref}`);
    const name = ref.slice(prefix.length);
    if (!Object.hasOwn(schemas, name)) fail(`Unresolved ref ${ref}`);
    return name;
  };
  const sameSet = (a, b) => a.length === b.length && a.every(value => b.includes(value));
  const isBareString = branch => branch && typeof branch === 'object' && branch.type === 'string' && Object.keys(branch).every(key => key === 'type' || annotations.has(key) || key.startsWith('x-'));
  /** anyOf [{ enum }, { type: 'string' }]: the contract's own open-enum spelling. */
  const openEnumBranches = branches => branches.length === 2 && branches.some(isBareString) && branches.some(branch => branch?.type === 'string' && Array.isArray(branch.enum)) ? branches.find(branch => Array.isArray(branch.enum)).enum : null;
  const openEnum = values => {
    if (!values.every(value => typeof value === 'string')) fail('An open enum must hold only strings');
    return `${sameSet(values, errorCodes) ? 'TotemErrorCode' : `(${values.map(quote).join(' | ')})`} | (string & {})`;
  };
  /** Per branch: the literal-valued properties whose literals differ from a sibling's. Narrowing needs them closed. */
  const discriminators = branches => {
    const literals = branches.map(branch => {
      const target = branch?.$ref ? schemas[resolve(branch.$ref)] : branch;
      const found = new Map();
      for (const [key, value] of Object.entries(target?.properties ?? {})) {
        if (value && typeof value === 'object' && (Object.hasOwn(value, 'const') || Array.isArray(value.enum))) {
          found.set(key, JSON.stringify(Object.hasOwn(value, 'const') ? [value.const] : [...value.enum].sort()));
        }
      }
      return found;
    });
    return branches.map((branch, index) => {
      const closed = new Set([...literals[index]].filter(([key, values]) => literals.some((other, at) => at !== index && other.has(key) && other.get(key) !== values)).map(([key]) => key));
      if (closed.size && branch?.$ref) fail(`Union discriminator ${[...closed].join(', ')} is behind ${branch.$ref}; inline the branch`);
      return closed;
    });
  };

  /** mode is 'response' (open enums) or 'request' (closed enums, optional fields accept undefined). */
  function type(schema, mode, closedEnum = false, closedProperties = new Set()) {
    if (schema === true) return 'unknown';
    if (schema === false) return 'never';
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) fail('Invalid schema');
    for (const key of Object.keys(schema)) {
      if (!structural.has(key) && !annotations.has(key) && !key.startsWith('x-')) fail(`Unsupported JSON Schema keyword ${key}`);
    }
    if (Array.isArray(schema.type)) {
      for (const key of ['properties', 'required', 'additionalProperties', 'items', 'anyOf', 'oneOf', 'allOf']) {
        if (Object.hasOwn(schema, key)) fail(`A type array cannot be combined with ${key}`);
      }
    }
    const parts = [];
    if (schema.$ref) {
      if (mode === 'request') fail(`Request schemas must be inline, not ${schema.$ref}`);
      parts.push(`Schemas[${quote(resolve(schema.$ref))}]`);
    }
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
      if (!schema[key]) continue;
      if (!Array.isArray(schema[key]) || !schema[key].length) fail(`${key} must be a nonempty array`);
      const open = key === 'anyOf' ? openEnumBranches(schema[key]) : null;
      if (open) { parts.push(`(${openEnum(open)})`); continue; }
      const closed = key === 'allOf' ? schema[key].map(() => new Set()) : discriminators(schema[key]);
      const union = `(${schema[key].map((branch, index) => type(branch, mode, false, closed[index])).join(key === 'allOf' ? ' & ' : ' | ')})`;
      parts.push(key !== 'allOf' && schema[key].every(branch => branch.type === 'object') ? `ExclusiveUnion<${union}>` : union);
    }
    if (Object.hasOwn(schema, 'const')) parts.push(quote(schema.const));
    else if (schema.enum) {
      if (!Array.isArray(schema.enum) || !schema.enum.length) fail('enum must be a nonempty array');
      parts.push(mode === 'request' || closedEnum ? `(${schema.enum.map(quote).join(' | ')})` : `(${openEnum(schema.enum)})`);
    }
    else if (Array.isArray(schema.type)) parts.push(`(${schema.type.map(value => type({ ...schema, type: value }, mode)).join(' | ')})`);
    else if (schema.type === 'object' || schema.properties) {
      if (schema.type !== undefined && schema.type !== 'object') fail(`properties on a ${schema.type} schema`);
      const properties = schema.properties ?? {};
      const required = schema.required ?? [];
      for (const name of required) if (!Object.hasOwn(properties, name)) fail(`required names ${name}, which is not a declared property`);
      if (schema.additionalProperties === false && !Object.keys(properties).length) fail('An empty closed object is not supported');
      const fields = Object.entries(properties).map(([key, value]) => {
        const optional = !required.includes(key);
        return `${doc(value?.description)}${quote(key)}${optional ? '?' : ''}: ${type(value, mode, closedProperties.has(key))}${optional && mode === 'request' ? ' | undefined' : ''}`;
      });
      if (schema.additionalProperties) fields.push(`[key: string]: ${schema.additionalProperties === true ? 'unknown' : type(schema.additionalProperties, mode)}`);
      parts.push(`{\n${fields.join(';\n')}\n}`);
    }
    else if (schema.type === 'array') parts.push(`Array<${type(schema.items ?? {}, mode)}>`);
    else if (schema.type === 'integer' || schema.type === 'number') parts.push('number');
    else if (['string', 'boolean', 'null'].includes(schema.type)) parts.push(schema.type);
    else if (schema.type) fail(`Unsupported schema type ${schema.type}`);
    return parts.join(' & ') || 'unknown';
  }

  const operations = {};
  const contracts = [];
  for (const [path, item] of Object.entries(document.paths)) {
    if (!item || typeof item !== 'object') fail(`Path ${path} is not a path item`);
    for (const key of Object.keys(item)) {
      if (key === '$ref') fail(`Path item $ref at ${path} is not supported`);
      if (key === 'parameters') fail(`Path-level parameters at ${path} are not supported; declare them on each operation`);
      if (!METHODS.includes(key) && key !== 'summary' && key !== 'description' && !key.startsWith('x-')) fail(`Unsupported path item key ${key} at ${path}`);
    }
    for (const method of METHODS.filter(name => Object.hasOwn(item, name))) {
      const operation = item[method];
      const id = operation?.operationId;
      if (typeof id !== 'string' || !id) fail(`${method.toUpperCase()} ${path} has no operationId`);
      if (Object.hasOwn(operations, id)) fail(`Duplicate operationId ${id}`);
      for (const key of ['servers', 'callbacks']) if (Object.hasOwn(operation, key)) fail(`${id}: ${key} is not supported`);
      const binding = operation['x-totem-tenant-binding'];
      if (!TENANT_BINDINGS.has(binding)) fail(`${id}: x-totem-tenant-binding ${quote(binding)} is not one of ${[...TENANT_BINDINGS].join(', ')}`);
      const parameters = (operation.parameters ?? []).map(param => {
        if (!param?.$ref) return param;
        const prefix = '#/components/parameters/';
        const target = param.$ref.startsWith(prefix) ? document.components.parameters?.[param.$ref.slice(prefix.length)] : undefined;
        return target ?? fail(`${id}: unresolved parameter ${param.$ref}`);
      });
      const seen = new Set();
      for (const param of parameters) {
        const label = `${id}: ${param.in} parameter ${param.name}`;
        if (typeof param.name !== 'string' || !param.name) fail(`${id}: a parameter has no name`);
        if (seen.has(`${param.in}:${param.name}`)) fail(`${label} is declared twice`);
        seen.add(`${param.in}:${param.name}`);
        if (param.in === 'cookie') fail(`${label}: cookie parameters are not supported`);
        if (param.in === 'header') {
          if (param.name.toLowerCase() !== 'totem-team' || binding !== 'team_header') fail(`${label}: only Totem-Team on team_header operations is supported`);
          continue;
        }
        if (param.in !== 'query' && param.in !== 'path') fail(`${label}: unsupported location`);
        if (!param.schema || param.content || param.style !== undefined || param.explode !== undefined) fail(`${label}: needs a plain schema`);
        if (param.in === 'path' && param.required !== true) fail(`${label} must be required`);
        if (param.in === 'path' && !path.includes(`{${param.name}}`)) fail(`${label} is not in the path template`);
        if (param.in === 'query' && !(SCALAR_QUERY_TYPES.has(param.schema.type) || (param.schema.enum && param.schema.type === undefined))) fail(`${label}: only scalar query values are supported`);
      }
      if (binding === 'team_header' && !parameters.some(param => param.in === 'header')) fail(`${id}: a team_header operation must declare the Totem-Team header`);
      for (const [, name] of path.matchAll(/\{([^}]+)\}/g)) {
        if (!parameters.some(param => param.in === 'path' && param.name === name)) fail(`${id}: path template names {${name}} with no path parameter`);
      }
      const parameterType = location => {
        const fields = parameters.filter(param => param.in === location).map(param => {
          const optional = param.required !== true;
          return `${doc(param.description ?? param.schema.description)}${quote(param.name)}${optional ? '?' : ''}: ${type(param.schema, 'request')}${optional ? ' | null | undefined' : ''}`;
        });
        return `{\n${fields.join(';\n')}\n}`;
      };
      let body = 'never';
      if (operation.requestBody !== undefined) {
        const request = operation.requestBody;
        if (request.$ref) fail(`${id}: requestBody $ref is not supported`);
        if (request.required !== true) fail(`${id}: an optional requestBody is not supported`);
        const media = Object.keys(request.content ?? {});
        if (media.length !== 1 || media[0] !== 'application/json' || !request.content['application/json'].schema) fail(`${id}: requestBody must be one application/json schema`);
        body = type(request.content['application/json'].schema, 'request');
      }
      const responses = operation.responses ?? {};
      for (const status of Object.keys(responses)) if (/^2/.test(status) && status !== '200') fail(`${id}: success status ${status} is not supported`);
      const success = responses['200'];
      if (!success || success.$ref) fail(`${id}: needs an inline 200 response`);
      const media = Object.keys(success.content ?? {});
      if (media.length !== 1 || media[0] !== 'application/json' || !success.content['application/json'].schema) fail(`${id}: the 200 response must be one application/json schema`);
      const security = operation.security ?? document.security ?? [];
      operations[id] = { method: method.toUpperCase(), path, authenticated: security.length !== 0, body: operation.requestBody !== undefined, team: binding === 'team_header', query: parameters.filter(param => param.in === 'query').map(param => param.name) };
      contracts.push(`${doc(operation.summary, operation.description)}${quote(id)}: { response: ${type(success.content['application/json'].schema, 'response')}; query: ${parameterType('query')}; path: ${parameterType('path')}; body: ${body} }`);
    }
  }
  if (!Object.keys(operations).length) fail('The contract has no operations');

  const aliases = Object.entries(schemas).map(([name, schema]) => {
    if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) fail(`Component ${name} is not a TypeScript type name`);
    if (RESERVED.has(name)) fail(`Component ${name} collides with an SDK export`);
    return `${doc(schema?.description)}export type ${name} = Schemas[${quote(name)}]`;
  });
  const actions = [...new Set(Object.values(errors).map(entry => entry.action))];
  const catalogue = Object.entries(errors).map(([code, entry]) => `${doc(entry.description)}${quote(code)}: { status: ${entry.status}, action: ${quote(entry.action)}, docUrl: ${quote(entry.doc_url)} }`);
  return {
    'schema.ts': `/** Generated from openapi.json. Do not edit; run npm run generate. */
type UnionKeys<T> = T extends unknown ? keyof T : never
type ExclusiveUnion<T, All = T> = T extends unknown ? T & Partial<Record<Exclude<UnionKeys<All>, keyof T>, never>> : never
/** Every error code the contract documents. New codes may appear: handle an unknown one by its status. */
export type TotemErrorCode = ${errorCodes.map(quote).join(' | ')}
/** What the caller should do about an error, from the contract's error catalogue. */
export type ErrorAction = ${actions.map(quote).join(' | ')}
export interface Schemas {
${Object.entries(schemas).map(([name, schema]) => `${doc(schema?.description)}${quote(name)}: ${type(schema, 'response')}`).join(';\n')}
}
export interface OperationContracts {
${contracts.join(';\n')}
}
${aliases.join('\n')}
`,
    'operations.ts': `/** Generated from openapi.json and package.json. Do not edit; run npm run generate. */
import type { ErrorAction, TotemErrorCode } from './schema.js'

export const CONTRACT_SHA256 = '${sha256}'
export const SDK_VERSION = '${version}'
export const DEFAULT_BASE_URL = ${quote(baseUrl)}
export const operationDefinitions = ${JSON.stringify(operations, null, 2)} as const
/** The contract's error catalogue: HTTP status, recommended action and docs entry for each code. */
export const errorCatalogue = {
${catalogue.join(',\n')}
} as const satisfies Record<TotemErrorCode, { readonly status: number; readonly action: ErrorAction; readonly docUrl: string }>
`,
  };
}

async function main() {
  const source = await readFile(new URL('../openapi.json', import.meta.url), 'utf8');
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const sha256 = createHash('sha256').update(source).digest('hex');
  const document = JSON.parse(source);
  const outputs = generate(document, { version, sha256 });
  for (const [file, content] of Object.entries(outputs)) {
    const path = new URL(`../src/generated/${file}`, import.meta.url);
    if (process.argv.includes('--check')) {
      if (await readFile(path, 'utf8').catch(() => '') !== content) throw new Error(`Generated ${file} differs; run npm run generate`);
    } else await writeFile(path, content);
  }
  console.log(`OpenAPI ${document.info.version}: ${Object.keys(document.paths).length} paths, SDK ${version}, SHA-256 ${sha256}`);
}
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
