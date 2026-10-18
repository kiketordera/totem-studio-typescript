/**
 * Install the SDK the documented Git way: commit a copy of the working tree
 * (no node_modules or dist) to a temporary repository and install it with
 * `git+file://` and lifecycle scripts on, so `prepare` builds dist exactly as
 * it does for a consumer. Needs npm registry access for TypeScript, so it is
 * not part of `npm run health`; CI runs it.
 */
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const temporary = await mkdtemp(join(tmpdir(), 'totem-sdk-git-install-'));
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: 'pipe', env: { ...process.env, npm_config_ignore_scripts: 'false' } }).toString().trim();
const excluded = new Set(['node_modules', 'dist', '.git', 'coverage']);
try {
  const repository = join(temporary, 'repository');
  await cp(root, repository, { recursive: true, filter: source => !excluded.has(basename(source)) && !/\.(tgz|key)$|-receipt\.json$|^\.env/.test(basename(source)) });
  run('git', ['init', '-q'], repository);
  run('git', ['add', '-A'], repository);
  run('git', ['-c', 'user.name=SDK install test', '-c', 'user.email=sdk-install-test@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-q', '-m', 'snapshot'], repository);
  const commit = run('git', ['rev-parse', 'HEAD'], repository);

  const consumer = join(temporary, 'consumer');
  await mkdir(consumer);
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  run('npm', ['install', `git+file://${repository}#${commit}`, '--ignore-scripts=false', '--no-audit', '--no-fund', '--package-lock=false'], consumer);
  run(process.execPath, ['--input-type=module', '-e', "const { TotemClient } = await import('@totemstudioai/sdk'); const client = new TotemClient({ apiKey: 'fictitious', fetch: async () => Response.json({ ok: true }) }); if (!(await client.me.get()).ok) throw new Error('ESM import of the Git install failed')"], consumer);
  run(process.execPath, ['--input-type=commonjs', '-e', `const { TotemClient } = require('@totemstudioai/sdk'); if (typeof TotemClient !== 'function') throw new Error('require of the Git install failed'); if (require('@totemstudioai/sdk/package.json').version !== ${JSON.stringify(version)}) throw new Error('wrong version installed')`], consumer);
  console.log(`Git install (git+file at ${commit.slice(0, 12)}, prepare build): ESM import, require() and package.json export all passed`);
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally { await rm(temporary, { recursive: true, force: true }); }
