import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(here, '..');
const coveragePath = 'brain/learning/full-chat-coverage-2026-08-31.json';

const requiredFingerprints = [
  'duplicate-periodic-obligation-owner-v1',
  'notion|title-property|undefined',
  'content|publication|schedule-source-mismatch',
  'mission-control|active-without-current-promotion-proof',
  'repeated-known-blocker-no-state-v1',
  'external-mutation|lost-ack|blind-retry',
  'make|cost|polling-retry-full-refresh-fanout',
  'governance|platform-control|internal-green-assumed-external-green',
  'github|repository|auto-merge-disabled',
  'supabase|sql-test|comment-counted-as-executable-semantic',
  'supabase|performance-advisor|info-without-workload-proof',
  'supabase|privileges|partial-revoke-left-truncate',
  'brain|evidence-write|assumed-column-or-enum-contract',
  'automation|scheduler|configured-but-never-observed',
  'supabase|trigger-proof|synthetic-noop-migration',
  'automation|event-trigger|duplicate-replay-without-exact-sha',
  'brain|delivery-classifier|new-runtime-path-unclassified',
  'netlify|deploy|connector-returned-command-not-execution',
  'runtime|network|dns-unavailable-not-product-failure',
  'delivery|production-parity|main-vs-deploy-sha-mismatch',
  'github|main-governance|post-push-ci-after-unauthorized-write',
  'make|scenario-state|paused-and-isActive-ambiguous',
  'mission-control|projection|burst-duplicate-fallback-rate-limit',
  'mission-control|bg190|direct-activate-bypasses-bg191',
  'mission-control|cache|stale-within-grace-not-verified-green',
  'netlify|env-var|credential-material-not-secret-classified',
  'brain-preflight|source-readback|config-only-false-negative',
  'delivery|test-path|unclassified-regression-file',
  'netlify-preview-provider-scope-mismatch-v1',
  'delivery|runtime-path|unclassified-netlify-build-control-v1',
  'delivery|verification|provider-impact-guard-needs-two-sided-proof-v1',
  'delivery|candidate|stale-open-pr-after-material-main-drift-v1',
  'delivery-failure|pipeline|shared|classified-change-test-not-executed',
  'chat-to-brain|make-control-plane-materialization|2026-08-31-v3',
  'make|multi-agent-context-learning-credit-storm|2026-08-30-v1',
  'make|bg184|repeated-known-blocker-paid-redispatch-v1',
  'connector|mutation|wrong-tool-or-resource-selected-v1',
  'delivery|classifier|learning-test-family-unclassified-v1',
  'github|pull-request|reused-head-pr-event-no-workflow-run-v1',
  'make|agent-template|unconditional-bg168-dispatch-on-resume-v1'
];

test('full durable learning coverage from the active chat is canonical and preflight-visible', async () => {
  const packet = compileChatLearningPreflight({ rootDir });
  const sources = new Set(packet.sources.map(source => source.path));
  assert.ok(sources.has(coveragePath), 'full-chat coverage manifest must be a mandatory preflight source');

  const coverage = JSON.parse(await readFile(path.join(rootDir, coveragePath), 'utf8'));
  assert.equal(coverage.status, 'ACTIVE');
  assert.equal(coverage.scope, 'FULL_DURABLE_CHAT_COVERAGE');
  assert.deepEqual(coverage.missing, []);
  assert.equal(coverage.security?.containsSecrets, false);
  assert.equal(coverage.security?.containsCredentials, false);
  assert.equal(coverage.security?.containsPii, false);

  const byFingerprint = new Map((coverage.coverage || []).map(item => [item.fingerprint, item]));
  for (const fingerprint of requiredFingerprints) {
    const item = byFingerprint.get(fingerprint);
    assert.ok(item, `coverage manifest missing ${fingerprint}`);
    assert.equal(typeof item.canonicalSource, 'string', `${fingerprint} missing canonicalSource`);
    const sourceText = await readFile(path.join(rootDir, item.canonicalSource), 'utf8');
    assert.ok(sourceText.includes(fingerprint), `${fingerprint} not present in canonical source ${item.canonicalSource}`);
    assert.ok(packet.fingerprints.includes(fingerprint), `${fingerprint} not visible in compiled BRAIN preflight`);
  }
});
