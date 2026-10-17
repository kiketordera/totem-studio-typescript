/**
 * Install the actual npm tarball (as the release asset is) into isolated ESM
 * and CommonJS consumers, compile them with TypeScript (module nodenext,
 * exactOptionalPropertyTypes) and run their imports, require() and the
 * package.json export.
 */
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const temporary = await mkdtemp(join(tmpdir(), 'totem-sdk-consumer-'));
const run = (command, args, cwd = temporary) => execFileSync(command, args, { cwd, stdio: 'pipe', env: process.env });
const tsc = cwd => run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', cwd]);
const compilerOptions = { target: 'ES2023', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, exactOptionalPropertyTypes: true, noEmitOnError: true, lib: ['ES2023', 'DOM'] };
try {
  run('npm', ['pack', '--pack-destination', temporary, '--json', '--ignore-scripts'], root);
  const archive = (await readdir(temporary)).find(file => file.endsWith('.tgz'));
  if (!archive) throw new Error('npm pack did not produce a tarball');
  await writeFile(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', join(temporary, archive), '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false']);

  await writeFile(join(temporary, 'index.ts'), `import { TotemClient, TotemApiError, isFeedRemoval } from '@totemstudio/sdk';
import type { Lead, FeedPage } from '@totemstudio/sdk';
declare const team: string | undefined;
const client = new TotemClient({ apiKey: 'tsk_live_fictitious_pack_test', team, fetch: async () => Response.json({ object: 'list', data: [], has_more: false, next_cursor: null }) });
const page = await client.leads.list({ limit: 1, status: 'new', cursor: null });
const leads: Lead[] = page.data;
const feed: AsyncGenerator<FeedPage> = client.pages('sync.changes');
void leads; void feed; void TotemApiError; void isFeedRemoval;
if (page.data.length !== 0) throw new Error('Packed SDK returned the wrong page');
// @ts-expect-error unknown query key must fail for installed consumers too
client.leads.list({ invalid_filter: true });
// @ts-expect-error items() cannot checkpoint the changes feed
client.items('sync.changes');
`);
  await writeFile(join(temporary, 'tsconfig.json'), JSON.stringify({ compilerOptions, include: ['index.ts'] }));
  tsc(temporary);

  // A CommonJS TypeScript project: no "type": "module", compiled with module nodenext, loaded through require(esm).
  const cjs = join(temporary, 'cjs');
  await mkdir(cjs);
  await writeFile(join(cjs, 'package.json'), JSON.stringify({ private: true }));
  await writeFile(join(cjs, 'index.ts'), `import { TotemClient, SDK_VERSION } from '@totemstudio/sdk';
import type { Me } from '@totemstudio/sdk';
const client = new TotemClient({ apiKey: 'fictitious', fetch: async () => Response.json({ name: 'cjs' }) });
client.me.get().then((me: Me) => { if (me.name !== 'cjs' || SDK_VERSION !== ${JSON.stringify(version)}) throw new Error('CommonJS TypeScript consumer failed'); });
`);
  await writeFile(join(cjs, 'tsconfig.json'), JSON.stringify({ compilerOptions: { ...compilerOptions, outDir: 'out' }, include: ['index.ts'] }));
  tsc(cjs);
  run(process.execPath, [join(cjs, 'out/index.js')], cjs);

  // Compile-only negative assertions must not execute.
  await writeFile(join(temporary, 'run.mjs'), `import { TotemClient } from '@totemstudio/sdk'; const client = new TotemClient({ apiKey: 'fictitious', fetch: async () => Response.json({ result: true }) }); if (!(await client.me.get()).result) throw new Error('ESM packed import failed');`);
  run(process.execPath, ['run.mjs']);
  run(process.execPath, ['--input-type=commonjs', '-e', `const { TotemClient } = require('@totemstudio/sdk'); if (typeof TotemClient !== 'function') throw new Error('require failed'); if (require('@totemstudio/sdk/package.json').version !== ${JSON.stringify(version)}) throw new Error('package.json export failed')`]);

  // LEGIT_GUARD: packaging contract in README.md "Types" — the published declarations name response types instead of inlining them, so field JSDoc survives.
  const declarations = await readFile(join(temporary, 'node_modules/@totemstudio/sdk/dist/client.d.ts'), 'utf8');
  if (!declarations.includes('Promise<LeadDetail>') || /"?object"?: "lead"/.test(declarations)) throw new Error('client.d.ts inlines response types');
  console.log('Packed consumer: ESM and CommonJS TypeScript compile, ESM runtime, require() and package.json export all passed');
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally { await rm(temporary, { recursive: true, force: true }); }
