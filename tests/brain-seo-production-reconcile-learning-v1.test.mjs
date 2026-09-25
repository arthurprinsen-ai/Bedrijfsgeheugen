import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (p) => readFile(new URL('../' + p, import.meta.url), 'utf8');

test('SEO production reconcile learning is canonically projected into Powerhouse skills', async () => {
  const fingerprint = 'seo|production-reconcile|exact-head-sibling-proof|v1';
  const [learningRaw, doc, ledger, projection, continuity] = await Promise.all([
    read('brain/learning/2026-09-25-seo-production-reconcile-exact-head-v1.json'),
    read('docs/changes/2026-09-25-seo-production-reconcile-exact-head-v1.md'),
    read('docs/development-ledger-events/2026-09-25-seo-production-reconcile-exact-head-learning-v1.md'),
    read('scripts/brain/powerhouse-skill-projection.mjs'),
    read('.agents/skills/powerhouse-continuity/SKILL.md')
  ]);

  const learning = JSON.parse(learningRaw);
  assert.equal(learning.fingerprint, fingerprint);
  assert.equal(learning.failure_class, 'DELIVERY_TERMINALIZATION');
  assert.ok(learning.evaluation?.historical_replay?.length);
  for (const skill of [
    'seo-revenue-growth',
    'powerhouse-continuity',
    'powerhouse-delivery-concurrency',
    'powerhouse-netlify-production-truth'
  ]) {
    assert.ok(learning.skill_targets.includes(skill), 'missing skill target: ' + skill);
  }
  assert.ok(doc.includes(fingerprint));
  assert.ok(ledger.includes(fingerprint));
  assert.match(projection, /skill_targets/);
  assert.match(continuity, /Automatic learning.*skill projection/is);
});
