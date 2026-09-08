import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeGitHubDeliveryEvent } from '../tools/delivery-github-event-context.mjs';

const sha = char => char.repeat(40);

test('pull request keeps immutable change head but tests the current merge candidate', () => {
  const context = normalizeGitHubDeliveryEvent({
    eventName: 'pull_request',
    event: { pull_request: { number: 1215, base: { sha: sha('a') }, head: { sha: sha('b') } } },
    githubSha: sha('c'),
    runId: '321',
  });

  assert.equal(context.baseSha, sha('a'));
  assert.equal(context.changeHeadSha, sha('b'));
  assert.equal(context.candidateSha, sha('c'));
  assert.equal(context.headSha, sha('c'));
});

test('Required classifies branch diff but executes code against merge candidate', () => {
  const workflow = readFileSync('.github/workflows/required-test.yml', 'utf8');
  assert.match(workflow, /change_head_sha=\$\{context\.changeHeadSha\}/);
  assert.match(workflow, /candidate_sha=\$\{context\.candidateSha\}/);
  assert.match(workflow, /context\.baseSha}\.\.\.\$\{context\.changeHeadSha}/);
  assert.match(workflow, /head_sha:\s*\$\{\{ needs\.preflight\.outputs\.candidate_sha \}\}/);
  assert.match(workflow, /change_head_sha:\s*\$\{\{ needs\.preflight\.outputs\.change_head_sha \}\}/);
  assert.match(workflow, /candidate_sha:\s*\$\{\{ needs\.preflight\.outputs\.candidate_sha \}\}/);
  assert.doesNotMatch(workflow, /Block unjustified moving-main successor rebuilds/);
});

test('website lane separates candidate build identity from Netlify preview identity', () => {
  const workflow = readFileSync('.github/workflows/lane-website.yml', 'utf8');
  assert.match(workflow, /change_head_sha:/);
  assert.match(workflow, /candidate_sha:/);
  assert.match(workflow, /ref:\s*\$\{\{ inputs\.candidate_sha \}\}/);
  assert.match(workflow, /HEAD_SHA:\s*\$\{\{ inputs\.change_head_sha \}\}/);
  assert.match(workflow, /EXPECTED_COMMIT:\s*\$\{\{ inputs\.change_head_sha \}\}/);
});

test('BRAIN drift evidence never requires branch rewrite for a mergeable candidate', () => {
  const tool = readFileSync('tools/brain-delivery-system.mjs', 'utf8');
  assert.match(tool, /REVALIDATE_MERGE_CANDIDATE/);
  assert.doesNotMatch(tool, /if \(result\.action === 'SYNC_REQUIRED'\) process\.exitCode = 42/);
});
