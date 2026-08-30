import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateWriterPaths } from './repo-writer-policy.mjs';

const headRef = String(process.env.REPO_WRITER_HEAD_REF || process.env.GITHUB_HEAD_REF || '').trim();
const baseSha = String(process.env.GITHUB_PR_BASE_SHA || '').trim();
const headSha = String(process.env.GITHUB_PR_HEAD_SHA || '').trim();
const evidencePath = String(process.env.REPO_WRITER_EVIDENCE_PATH || 'artifacts/repo-writer-shadow-evidence.json').trim();
const shaPattern = /^[0-9a-f]{40}$/i;

if (!headRef.startsWith('writer/')) throw new Error('NOT_WRITER_CANDIDATE');
if (!shaPattern.test(baseSha)) throw new Error('INVALID_PR_BASE_SHA');
if (!shaPattern.test(headSha)) throw new Error('INVALID_PR_HEAD_SHA');

const parts = headRef.split('/');
const writer = parts[1];
if (!writer) throw new Error('INVALID_WRITER_BRANCH');

const checkedOutHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (checkedOutHead !== headSha) throw new Error(`HEAD_SHA_DRIFT:${checkedOutHead}:${headSha}`);

const changedFiles = execFileSync('git', ['diff', '--name-only', `${baseSha}...${headSha}`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean);

const result = validateWriterPaths(writer, changedFiles);
const evidence = Object.freeze({
  schemaVersion: 1,
  writer,
  candidateBranch: headRef,
  baseSha,
  headSha,
  changedFiles: result.files,
  pathPolicyVerified: true,
  exactHeadVerified: true,
});

mkdirSync(dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(evidence)}\n`);
