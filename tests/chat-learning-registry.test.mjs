import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('chat-derived engineering learnings are machine-readable and mandatory for agents', () => {
  const registry = JSON.parse(readFileSync('brain/memory/chat-learning-registry.json', 'utf8'));
  const agents = readFileSync('AGENTS.md', 'utf8');

  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.contract, 'BRAIN-CHAT-LEARNING-v1');
  assert.equal(registry.readBeforeMaterialWork, true);
  assert.equal(registry.writebackRequiredBeforeDone, true);
  assert.ok(registry.learnings.length >= 10);
  assert.ok(registry.learnings.every(x => x.fingerprint && x.failureMode && x.rootCause && x.prevention && x.gate));

  const required = [
    'stale-branch-main-drift',
    'exact-sha-production-proof',
    'no-force-over-concurrent-work',
    'import-does-not-equal-execution',
    'canonical-footer-single-source',
    'seo-keyword-owner-cannibalization',
    'max-two-identical-retries',
    'green-means-outcome-verified',
    'independent-delivery-shared-intelligence',
    'writeback-before-done'
  ];
  for (const fingerprint of required) {
    assert.ok(registry.learnings.some(x => x.fingerprint === fingerprint), `missing learning ${fingerprint}`);
  }

  assert.match(agents, /Eén team, één geheugen/);
  assert.match(agents, /repo en Powerhouse Team Memory vormen samen het gedeelde geheugen/i);
  assert.match(agents, /Niet opnieuw ontdekken/);
});
