import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyMainWrite, resolveMainWriteAssociatedPullRequests } from '../tools/main-write-integrity.mjs';

test('verified material single-parent write to main without PR association is a governance incident', () => {
  const result = classifyMainWrite({
    branch: 'main',
    parentCount: 1,
    changedPaths: ['tests/development-doc-contract.test.mjs'],
    headSha: '1e33e684905bd187e44389d30433dd64cf872f9b',
    associatedPullRequests: [],
  });
  assert.equal(result.status, 'DIRECT_MAIN_WRITE_INCIDENT');
  assert.equal(result.productionGreenAllowed, false);
  assert.equal(result.recoveryRequired, true);
  assert.equal(result.fingerprint, 'delivery|main-write|material-single-parent-bypass-v1');
});

test('material single-parent write with unverifiable PR association fails closed', () => {
  const result = classifyMainWrite({
    branch: 'main',
    parentCount: 1,
    changedPaths: ['tests/development-doc-contract.test.mjs'],
    headSha: '1e33e684905bd187e44389d30433dd64cf872f9b',
  });
  assert.equal(result.status, 'UNKNOWN_MAIN_WRITE');
  assert.equal(result.productionGreenAllowed, false);
  assert.equal(result.recoveryRequired, true);
  assert.equal(result.fingerprint, 'delivery|main-write|unverifiable-pr-association-v1');
});

test('github merge commit on main is not classified as direct-main bypass', () => {
  const result = classifyMainWrite({ branch: 'main', parentCount: 2, changedPaths: ['tests/development-doc-contract.test.mjs'], headSha: 'merge-sha' });
  assert.equal(result.status, 'GOVERNED_MERGE');
  assert.equal(result.productionGreenAllowed, true);
});

test('candidate branch write does not trigger main incident', () => {
  const result = classifyMainWrite({ branch: 'brain/candidate', parentCount: 1, changedPaths: ['tools/example.mjs'], headSha: 'candidate-sha' });
  assert.equal(result.status, 'NOT_MAIN');
});

test('main integrity workflow observes every main push and is read-only for repository content', async () => {
  const workflow = await readFile('.github/workflows/main-write-integrity.yml', 'utf8');
  assert.match(workflow, /push:\s*[\s\S]*branches:\s*\[main\]/);
  assert.match(workflow, /tools\/main-write-integrity\.mjs/);
  assert.match(workflow, /contents:\s*read/);
  assert.doesNotMatch(workflow, /contents:\s*write/);
  assert.doesNotMatch(workflow, /git push|gh pr merge|netlify deploy/i);
});

test('direct-main recurrence remains actionable shared learning', async () => {
  const preflight = await readFile('tools/delivery-preflight.mjs', 'utf8');
  const lessons = await readFile('brain/learning/current-execution-lessons-2026-08-30.json', 'utf8');
  assert.match(lessons, /github\|main-governance\|post-push-ci-after-unauthorized-write/);
  assert.match(preflight, /executionLessonsPath/);
});

test('main-write incidents create or update one stateful deduplicated recovery issue using classifier fingerprint', async () => {
  const workflow = await readFile('.github/workflows/main-write-integrity.yml', 'utf8');
  assert.match(workflow, /issues:\s*write/);
  assert.match(workflow, /fingerprint=\$\{result\.fingerprint\s*\?\?/);
  assert.match(workflow, /FINGERPRINT:\s*\$\{\{\s*steps\.classify\.outputs\.fingerprint\s*\}\}/);
  assert.match(workflow, /status=\$\{result\.status\}/);
  assert.match(workflow, /gh api/);
  assert.match(workflow, /issues\?state=open/);
  assert.match(workflow, /jq --arg fingerprint/);
  assert.match(workflow, /contains\(\$fingerprint\)/);
  assert.doesNotMatch(workflow, /contains\(env\.FINGERPRINT\)/);
  assert.match(workflow, /last_seen_sha/);
  assert.match(workflow, /recoveryRequired/);
  assert.match(workflow, /if:\s*always\(\)/);
});

const HEAD = '4ce0846ca51227169389241d3a122b274795a0b2';
const canonicalPr = { number: 4658, merged_at: '2026-10-22T15:43:21Z', base: { ref: 'main' }, merge_commit_sha: HEAD };
const mainProvenanceArgs = { branch: 'main', parentCount: 1, changedPaths: ['.github/workflows/main-write-integrity.yml'], headSha: HEAD };

test('main write: real GitHub commit PR association proves governed squash merge', async () => {
  const lookup = await resolveMainWriteAssociatedPullRequests({
    repository: 'arthurprinsen-ai/Bedrijfsgeheugen', headSha: HEAD, commitSubject: 'fix: recovery (#4658)',
    githubRead: async path => path.endsWith('/pulls') ? [canonicalPr] : null, sleep: async () => {},
  });
  assert.equal(lookup.source, 'GITHUB_COMMIT_ASSOCIATION');
  assert.equal(classifyMainWrite({ ...mainProvenanceArgs, associatedPullRequests: lookup.associatedPullRequests }).status, 'GOVERNED_SQUASH_MERGE');
});

test('main write: malformed transient commit-association API falls back only to exact provider-verified PR', async () => {
  let primary = 0;
  const lookup = await resolveMainWriteAssociatedPullRequests({
    repository: 'arthurprinsen-ai/Bedrijfsgeheugen', headSha: HEAD,
    commitSubject: 'fix(github): autonomous recovery (#4658)', sleep: async () => {},
    githubRead: async path => {
      if (path.includes('/commits/')) { primary++; throw new SyntaxError('Unexpected end of JSON input'); }
      if (path.endsWith('/pulls/4658')) return canonicalPr;
      throw new Error('unexpected path');
    },
  });
  assert.equal(primary, 3);
  assert.equal(lookup.source, 'GITHUB_VERIFIED_PR_FALLBACK');
  assert.equal(classifyMainWrite({ ...mainProvenanceArgs, associatedPullRequests: lookup.associatedPullRequests }).status, 'GOVERNED_SQUASH_MERGE');
});

test('main write: forged squash message cannot bypass PR verification', async () => {
  const lookup = await resolveMainWriteAssociatedPullRequests({
    repository: 'arthurprinsen-ai/Bedrijfsgeheugen', headSha: HEAD,
    commitSubject: 'unauthorized direct main write (#4658)', sleep: async () => {},
    githubRead: async path => path.includes('/commits/') ? [] : { ...canonicalPr, merge_commit_sha: 'e'.repeat(40) },
  });
  assert.notEqual(classifyMainWrite({ ...mainProvenanceArgs, associatedPullRequests: lookup.associatedPullRequests }).status, 'GOVERNED_SQUASH_MERGE');
});

test('main write: provider outage and unsupported commit hint preserve fail-closed unknown', async () => {
  const lookup = await resolveMainWriteAssociatedPullRequests({
    repository: 'arthurprinsen-ai/Bedrijfsgeheugen', headSha: HEAD,
    commitSubject: 'unverified direct push', sleep: async () => {},
    githubRead: async () => { throw new Error('HTTP 500'); },
  });
  assert.equal(lookup.associatedPullRequests, undefined);
  assert.equal(classifyMainWrite({ ...mainProvenanceArgs, associatedPullRequests: lookup.associatedPullRequests }).status, 'UNKNOWN_MAIN_WRITE');
});

test('main write: fallback requires merged_at, main branch, numeric PR and immutable commit equality', async () => {
  for (const invalid of [
    { ...canonicalPr, merged_at: null }, { ...canonicalPr, base: { ref: 'release' } },
    { ...canonicalPr, number: 1 }, { ...canonicalPr, merge_commit_sha: 'a'.repeat(40) },
  ]) {
    const lookup = await resolveMainWriteAssociatedPullRequests({
      repository: 'arthurprinsen-ai/Bedrijfsgeheugen', headSha: HEAD,
      commitSubject: 'fix: test (#4658)', sleep: async () => {},
      githubRead: async path => path.includes('/commits/') ? [] : invalid,
    });
    assert.notEqual(classifyMainWrite({ ...mainProvenanceArgs, associatedPullRequests: lookup.associatedPullRequests }).status, 'GOVERNED_SQUASH_MERGE');
  }
});

test('main write: existing workflow preserves bounded provider proof and red fail-closed boundary', async () => {
  const w = await readFile('.github/workflows/main-write-integrity.yml', 'utf8');
  assert.match(w, /resolveMainWriteAssociatedPullRequests/);
  assert.match(w, /MAIN_WRITE_PROVIDER_PR_PROOF/);
  assert.match(w, /Fail closed on ungoverned main write/);
  assert.match(w, /recoveryRequired == 'true'/);
  assert.doesNotMatch(w, /contents:\s*write/);
});
