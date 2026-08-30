import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('operational verifier hands remaining writers to immutable shadow without PR/content write access', async () => {
  const text = await readFile('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  assert.match(text, /pull-requests:\s*read/);
  assert.match(text, /Dispatch immutable read-only shadow/);
  for (const writer of ['paginacontrole','regelgeving-bijwerken','seo-controle','weekblog']) {
    assert.match(text, new RegExp(`WRITER='${writer}'`));
  }
  assert.match(text, /GENERIC_SHADOW='true'/);
  assert.match(text, /writer\/\$WRITER\//);
  assert.match(text, /VERIFY_SHA/);
  assert.match(text, /gh pr list/);
  assert.match(text, /contains\(\$verify\)/);
  assert.match(text, /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{PR_NUMBER\}" --jq '\.base\.sha'/);
  assert.match(text, /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{PR_NUMBER\}" --jq '\.head\.sha'/);
  assert.match(text, /gh api "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{PR_NUMBER\}" --jq '\.head\.ref'/);
  assert.match(text, /PR_HEAD_REF" != "writer\/\$WRITER\//);
  assert.match(text, /gh workflow run repo-writer-candidate-shadow\.yml/);
  assert.match(text, /-f pr_number="\$PR_NUMBER"/);
  assert.match(text, /-f base_sha="\$PR_BASE_SHA"/);
  assert.match(text, /-f head_sha="\$PR_HEAD_SHA"/);
  assert.match(text, /-f candidate_branch="\$PR_HEAD_REF"/);
});

test('self-shadow writers are not double-dispatched by the generic handoff', async () => {
  const text = await readFile('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  for (const writer of ['menu-balk-fix','approved-central-blog','blog-bijwerken']) {
    const escaped = writer.replaceAll('-', '\\-');
    assert.match(text, new RegExp(`WRITER='${escaped}'.*GENERIC_SHADOW='false'`));
  }
});
