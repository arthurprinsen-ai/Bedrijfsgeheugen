import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('LIVE_BEWEZEN exact-main atomic proof is durably projected', () => {
  const learning = JSON.parse(read('brain/learning/2026-09-25-live-bewezen-exact-main-atomic-proof-v1.json'));
  assert.equal(learning.fingerprint, 'delivery|live-bewezen|exact-main-netlify-browser-atomic-proof|v1');
  assert.match(learning.root_cause.join(' '), /moving authorities|protected main|main/i);
  assert.ok(learning.prevention.some(x => /commit_ref.*main SHA/i.test(x)));
  assert.ok(learning.prevention.some(x => /hidden DOM|source fallback/i.test(x)));

  const continuity = read('.agents/skills/powerhouse-continuity/SKILL.md');
  assert.match(continuity, /Exact-main live proof must be sampled atomically/);
  assert.match(continuity, /commit_ref === current main SHA/);
  assert.match(continuity, /hidden fallback\/error string/);

  const concurrency = read('.agents/skills/powerhouse-delivery-concurrency/SKILL.md');
  assert.match(concurrency, /Moving-main terminal proof is descendant-aware, single-lineage/);
  assert.match(concurrency, /Do not increase CI\/deploy fan-out/);

  const netlify = read('.agents/skills/powerhouse-netlify-production-truth/SKILL.md');
  assert.match(netlify, /Current-pointer truth versus hidden DOM diagnostics/);
  assert.match(netlify, /commit_ref equals that exact current-main SHA/);
  assert.match(netlify, /canonical browser verifier exposes the message in visible body text/);

  const selfOpt = read('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md');
  assert.match(selfOpt, /Prefer authoritative proof composition over repeated redeploys/);
  assert.match(selfOpt, /tool\/orchestration timeout is not an application failure/);

  const agents = read('AGENTS.md');
  assert.match(agents, /Atomic LIVE_BEWEZEN production truth/);
  assert.match(agents, /verborgen fallback\/error-copy/);
});
