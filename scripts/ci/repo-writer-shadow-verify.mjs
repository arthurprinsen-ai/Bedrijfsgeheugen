import { execFileSync } from 'node:child_process';
import { validateWriterPaths } from './repo-writer-policy.mjs';

const headRef = String(process.env.GITHUB_HEAD_REF || '').trim();
const baseRef = String(process.env.GITHUB_BASE_REF || 'main').trim();
if (!headRef.startsWith('writer/')) throw new Error('NOT_WRITER_CANDIDATE');

const parts = headRef.split('/');
const writer = parts[1];
if (!writer) throw new Error('INVALID_WRITER_BRANCH');

execFileSync('git', ['fetch', '--no-tags', 'origin', baseRef], { stdio: 'inherit' });
const files = execFileSync('git', ['diff', '--name-only', `origin/${baseRef}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean);

const result = validateWriterPaths(writer, files);
process.stdout.write(`${JSON.stringify(result)}\n`);
