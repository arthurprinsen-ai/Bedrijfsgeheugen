import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(
  new URL('../supabase/functions/powerhouse-content-loop/index.ts', import.meta.url),
  'utf8'
);

test('a new day must bootstrap content decisions before checking pending generation', () => {
  const decisionBootstrap = source.indexOf('const requiredDecisionChannels =');
  const decisionGeneration = source.indexOf('const MAX_CHANNEL_GENERATIONS = 4');
  assert.ok(decisionBootstrap > 0, 'missing decision bootstrap');
  assert.ok(decisionGeneration > decisionBootstrap, 'bootstrap must precede pending generation');
  for (const channel of ['linkedin_personal', 'linkedin_company', 'instagram_company', 'blog']) {
    assert.ok(source.slice(decisionBootstrap, decisionGeneration).includes(channel));
  }
  assert.match(source, /\.in\('channel', requiredDecisionChannels\)/);
  assert.match(source, /requiredDecisionChannels\.some\(channel => !existingDecisionChannels\.has\(channel\)\)/);
});

test('bootstrap uses the existing orchestrator under existing lease, with bounded no-double-invoke', () => {
  assert.match(source, /claimLoopLease\(runDate, leaseHolder\)/);
  assert.match(source, /invoke\(url, expected, 'powerhouse-content-orchestrator', \{ runDate \}\)/);
  assert.match(source, /bootstrapStillInFlight = seeded\.timed_out === true \|\| seeded\.http === 0/);
  assert.match(source, /generatedRounds < MAX_CHANNEL_GENERATIONS && !bootstrapStillInFlight/);
  assert.match(source, /releaseLoopLease\(runDate, leaseHolder\)/);
});

test('does not bypass provider proof, quality or remove channel isolation', () => {
  assert.match(source, /powerhouse-social-publisher', \{ runDate, mode: 'audit_only' \}/);
  assert.match(source, /powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}/);
  assert.match(source, /powerhouse-instagram-media-router/);
  assert.match(source, /powerhouse-blog-queue/);
  assert.match(source, /providerSideEffectTerminal/);
  assert.match(source, /providerTruthHealthy/);
});
