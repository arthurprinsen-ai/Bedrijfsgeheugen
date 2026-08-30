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

const diffRange = `${baseSha}...${headSha}`;
const changedFiles = execFileSync('git', ['diff', '--name-only', diffRange], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean);
const diffStats = execFileSync('git', ['diff', '--numstat', diffRange], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)
  .map((line) => {
    const [added, deleted, ...fileParts] = line.split('\t');
    const file = fileParts.join('\t');
    if (!file || added === '-' || deleted === '-') throw new Error(`UNSUPPORTED_WRITER_BINARY_DIFF:${file || line}`);
    return Object.freeze({ file, additions: Number(added), deletions: Number(deleted) });
  });

const result = validateWriterPaths(writer, changedFiles, diffStats);
const evidence = Object.freeze({
  schemaVersion: 1,
  writer,
  candidateBranch: headRef,
  baseSha,
  headSha,
  changedFiles: result.files,
  diffStats,
  pathPolicyVerified: true,
  impactPolicyVerified: true,
  exactHeadVerified: true,
});

mkdirSync(dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify(evidence)}\n`);
