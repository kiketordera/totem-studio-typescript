/** Install the actual npm tarball into an isolated consumer and compile/run imports. */
import { mkdtemp, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const temporary = await mkdtemp(join(tmpdir(), 'totem-sdk-consumer-'));
const run = (command, args, cwd = temporary) => execFileSync(command, args, { cwd, stdio: 'pipe', env: process.env });
try {
  run('npm', ['pack', '--pack-destination', temporary, '--json', '--ignore-scripts'], root);
  const archive = (await readdir(temporary)).find(file => file.endsWith('.tgz'));
  if (!archive) throw new Error('npm pack did not produce a tarball');
  await writeFile(join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', join(temporary, archive), '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false']);
  await writeFile(join(temporary, 'index.ts'), `import { TotemClient, TotemApiError } from '@totemstudio/sdk';
import type { Lead, FeedItem } from '@totemstudio/sdk';
const client = new TotemClient({ apiKey: 'tsk_live_fictitious_pack_test', fetch: async () => Response.json({ object: 'list', data: [], has_more: false, next_cursor: null }) });
const page = await client.leads.list({ limit: 1, status: 'new' });
const leads: Lead[] = page.data;
const feed: AsyncGenerator<FeedItem> = client.items('sync.changes');
void leads; void feed; void TotemApiError;
if (page.data.length !== 0) throw new Error('Packed SDK returned the wrong page');
// @ts-expect-error unknown query key must fail for installed consumers too
client.leads.list({ invalid_filter: true });
`);
  await writeFile(join(temporary, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2023', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmitOnError: true, lib: ['ES2023', 'DOM'] }, include: ['index.ts'] }));
  run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', temporary]);
  // Compile-only negative assertion must not execute.
  await writeFile(join(temporary, 'run.mjs'), `import { TotemClient } from '@totemstudio/sdk'; const client = new TotemClient({ apiKey: 'fictitious', fetch: async () => Response.json({ result: true }) }); if (!(await client.me.get()).result) throw new Error('ESM packed import failed');`);
  run(process.execPath, ['run.mjs']);
  run(process.execPath, ['--input-type=commonjs', '-e', "const { TotemClient } = require('@totemstudio/sdk'); if (typeof TotemClient !== 'function') throw new Error('Node24 require failed')"]);
  console.log('Packed consumer: TypeScript compile, ESM runtime, Node24 require all passed');
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally { await rm(temporary, { recursive: true, force: true }); }
