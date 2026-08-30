import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { proveGitTransportParity } from '../scripts/brain/writer-git-parity-proof.mjs';

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

test('real candidate diff is byte-identical to direct apply and reverse apply restores exact base', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'writer-parity-'));
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'test');
  await writeFile(join(repo, 'writer-output.txt'), 'base\n');
  git(repo, 'add', 'writer-output.txt');
  git(repo, 'commit', '-qm', 'base');
  const baseSha = git(repo, 'rev-parse', 'HEAD');
  await writeFile(join(repo, 'writer-output.txt'), 'candidate\n');
  git(repo, 'add', 'writer-output.txt');
  git(repo, 'commit', '-qm', 'candidate');
  const candidateHeadSha = git(repo, 'rev-parse', 'HEAD');

  const result = await proveGitTransportParity({ repoDir: repo, baseSha, candidateHeadSha, changedFiles: ['writer-output.txt'] });
  assert.equal(result.baseSha, baseSha);
  assert.equal(result.candidateHeadSha, candidateHeadSha);
  assert.equal(result.rollbackSha, baseSha);
  assert.equal(result.directOutputSha256, result.candidateOutputSha256);
  assert.equal(result.rollbackOutputSha256, result.baseOutputSha256);
  assert.equal(await readFile(join(repo, 'writer-output.txt'), 'utf8'), 'candidate\n');
});

test('unrelated concurrent history outside declared writer paths does not contaminate scoped parity', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'writer-parity-concurrent-'));
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'test');
  await writeFile(join(repo, 'writer-output.txt'), 'base\n');
  await writeFile(join(repo, 'unrelated.txt'), 'before\n');
  git(repo, 'add', 'writer-output.txt', 'unrelated.txt');
  git(repo, 'commit', '-qm', 'base');
  const baseSha = git(repo, 'rev-parse', 'HEAD');
  await writeFile(join(repo, 'writer-output.txt'), 'candidate\n');
  await writeFile(join(repo, 'unrelated.txt'), 'parallel brain change\n');
  git(repo, 'add', 'writer-output.txt', 'unrelated.txt');
  git(repo, 'commit', '-qm', 'candidate plus concurrent work');
  const candidateHeadSha = git(repo, 'rev-parse', 'HEAD');

  const result = await proveGitTransportParity({ repoDir: repo, baseSha, candidateHeadSha, changedFiles: ['writer-output.txt'] });
  assert.equal(result.directOutputSha256, result.candidateOutputSha256);
  assert.equal(result.rollbackOutputSha256, result.baseOutputSha256);
  assert.deepEqual(result.changedFiles, ['writer-output.txt']);
});

test('parity proof fails closed when declared changed files do not match the candidate diff', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'writer-parity-mismatch-'));
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'user.name', 'test');
  await writeFile(join(repo, 'a.txt'), 'base\n');
  git(repo, 'add', 'a.txt');
  git(repo, 'commit', '-qm', 'base');
  const baseSha = git(repo, 'rev-parse', 'HEAD');
  await writeFile(join(repo, 'a.txt'), 'changed\n');
  git(repo, 'add', 'a.txt');
  git(repo, 'commit', '-qm', 'candidate');
  const candidateHeadSha = git(repo, 'rev-parse', 'HEAD');
  await assert.rejects(proveGitTransportParity({ repoDir: repo, baseSha, candidateHeadSha, changedFiles: ['wrong.txt'] }), /CHANGED_FILES_MISMATCH/);
});

test('parity runtime is agent-executable, zero-external and reconciles only verified evidence', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-parity-rollback.yml', 'utf8');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /verify-parity\//);
  assert.match(workflow, /repository-writer-migration\.json/);
  assert.match(workflow, /writer-git-parity-proof\.mjs/);
  assert.match(workflow, /writer-parity-rollback-certification\.mjs/);
  assert.match(workflow, /writer-certification-state\.mjs/);
  for (const writer of ['approved-central-blog','blog-bijwerken','menu-balk-fix','paginacontrole','regelgeving-bijwerken','seo-controle','weekblog']) assert.match(workflow, new RegExp(writer.replaceAll('-', '\\-')));
  assert.match(workflow, /gh pr create/);
  assert.doesNotMatch(workflow, /ANTHROPIC_API_KEY|NOTION_TOKEN|NOTION_BLOG_DB|BG_SEO_WEBHOOK|api\.anthropic\.com/);
  assert.doesNotMatch(workflow, /gh pr merge|git push origin HEAD:main|git push origin main/);
});
