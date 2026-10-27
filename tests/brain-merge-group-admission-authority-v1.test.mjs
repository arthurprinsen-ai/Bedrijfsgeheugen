import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveDeliveryMetadataAuthority } from '../tools/delivery/delivery-metadata-authority.mjs';
import { normalizeGitHubDeliveryEvent } from '../tools/delivery-github-event-context.mjs';

const sha = char => char.repeat(40);

test('merge groups cannot borrow an old one-loop single-PR manifest', () => {
  const manifest = {
    version: 'POWERHOUSE-DELIVERY-CANDIDATE-v1',
    obligationId: 'historic-obligation',
    deliveryLane: 'automation',
    candidateType: 'docs',
    baseSha: sha('a'),
    expectedPaths: ['unrelated/historic-file'],
    maxFiles: 1,
  };
  assert.throws(() => resolveDeliveryMetadataAuthority({
    eventName: 'merge_group',
    manifest,
    prBody: 'Obligation-ID: historic-obligation',
  }), /MERGE_GROUP_ADMISSION_PROOF_REQUIRED/);
});

test('merge-group run ID is not a PR identity and Required passes event type', () => {
  const context = normalizeGitHubDeliveryEvent({
    eventName: 'merge_group',
    event: { merge_group: { base_sha: sha('b'), head_sha: sha('c') } },
    githubSha: sha('c'), runId: '39999999999',
  });
  assert.equal(context.prNumber, null);
  assert.equal(context.candidateSha, sha('c'));
  assert.equal(context.baseSha, sha('b'));
  const source = readFileSync(new URL('../.github/workflows/required-test.yml', import.meta.url), 'utf8');
  assert.match(source, /eventName:\s*process\.env\.EVENT_NAME/);
  assert.match(source, /context\.prNumber\s*\?/);
  assert.match(source, /resolveDeliveryMetadataAuthority\(/);
  assert.match(source, /merge_group:/);
});

test('real PR metadata still follows the original authority contract', () => {
  const result = resolveDeliveryMetadataAuthority({
    eventName: 'pull_request',
    prBody: [
      'Obligation-ID: valid-pr',
      'Delivery-Lane: automation',
      'Candidate-Type: recovery',
      `Base-SHA: ${sha('a')}`,
      'Change-Scope: tools/example.mjs',
      'Scope-Budget: 1',
    ].join('\n'),
  });
  assert.equal(result.source, 'pr-body');
  assert.deepEqual(result.expectedPaths, ['tools/example.mjs']);
  assert.equal(result.maxFiles, 1);
});
