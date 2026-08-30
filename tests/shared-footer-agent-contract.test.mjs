import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');

test('canonical footer governance inherits current shared Brain learning contract', () => {
  const doc = read('docs/canonical-seo-footer.md');
  const agents = read('AGENTS.md');
  const brain = JSON.parse(read('config/brain-chat-learning-contract.json'));
  const completeness = JSON.parse(read('config/chat-learning-completeness-guard.json'));
  const footer = JSON.parse(read('site/footer-contract.json'));

  assert.match(doc, /canonical-seo-footer-v1/);
  assert.match(doc, /\.github\/canoniek\/voet\.html/);
  assert.match(doc, /component:footer/);
  assert.match(doc, /area:seo/);
  assert.match(doc, /config\/brain-chat-learning-contract\.json/);
  assert.match(doc, /chat-learning completeness|chat-learning-completeness/i);
  assert.doesNotMatch(doc, /brain\/memory\/chat-learning-registry\.json/);
  assert.match(doc, /preview.*production|preview-before-production/i);
  assert.match(doc, /writeback.*done|writeback-before-done/i);

  assert.equal(brain.preflightRequired, true);
  assert.equal(brain.newAgentsMustReadBeforeExecution, true);
  assert.equal(brain.policy.writeNewMaterialLearningBack, true);
  assert.ok(completeness.rules?.blockMaterialCompletionWhenLearningIsChatOnly || completeness.blockMaterialCompletionWhenLearningIsChatOnly || completeness.policy?.blockMaterialCompletionWhenLearningIsChatOnly);
  assert.deepEqual(footer.requiredScopes, ['component:footer', 'area:seo']);
  assert.equal(footer.rules.footerChangesRequireSeoGreen, true);
  assert.match(agents, /BRAIN chat-learning preflight/i);
  assert.match(agents, /Eén team, één geheugen/i);
  assert.match(agents, /CONTRACT_CHANGE/);
  assert.match(agents, /PRODUCTION_PROMOTION/);
});
