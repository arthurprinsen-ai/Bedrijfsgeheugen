import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { evaluatePromotion } from '../scripts/production/promotion-controller.mjs';

const authoritative = {
  status: 'GREEN',
  production_sha: 'main123',
  last_known_good_sha: 'lkg123',
  production_tree_sha: 'tree-main',
  last_known_good_tree_sha: 'tree-lkg'
};

const base = {
  fingerprint: 'production|candidate|abc',
  owner_agent: '09',
  candidate_branch: 'automation/example',
  candidate_sha: 'candidate123',
  tested_head_sha: 'candidate123',
  base_sha: 'main123',
  current_main_sha: 'main123',
  last_known_good_sha: 'caller-should-not-control-this',
  authoritative_production_state: authoritative,
  last_known_good_deploy_id: 'deploy-old',
  current_hypothesis: 'fix build',
  retry_count_for_hypothesis: 0,
  hard_boundary: false,
  ci_status: 'green',
  preview_status: 'green',
  rollback_ready: true,
  production_status: 'not_started'
};

test('paginacontrole publication paths synchronize with current main without stale-worktree races', async () => {
  const workflow = await readFile(new URL('../.github/workflows/paginacontrole.yml', import.meta.url), 'utf8');
  const sourceStart = workflow.indexOf('- name: Bekende SEO-bronfouten automatisch herstellen');
  const sourceEnd = workflow.indexOf('- name: Playwright installeren', sourceStart);
  assert.ok(sourceStart >= 0 && sourceEnd > sourceStart, 'source-repair step must exist');
  const sourceRepair = workflow.slice(sourceStart, sourceEnd);
  assert.match(sourceRepair, /git pull --rebase origin main/);
  assert.match(sourceRepair, /git push(?: origin HEAD:main)?/);

  const stepStart = workflow.indexOf('- name: seo-status.json verwerken als hij is veranderd');
  const stepEnd = workflow.indexOf('- name: Candidate branch en PR publiceren', stepStart);
  assert.ok(stepStart >= 0 && stepEnd > stepStart, 'seo-status publication step must exist');
  const statusPublication = workflow.slice(stepStart, stepEnd);
  assert.match(statusPublication, /git fetch origin main/);
  assert.match(statusPublication, /git reset --hard origin\/main/);
  assert.match(statusPublication, /cp \/tmp\/seo-status\.json seo-status\.json/);
  assert.match(statusPublication, /git push origin HEAD:main/);
  assert.doesNotMatch(statusPublication, /git pull --rebase origin main/);
});

test('green exact candidate is ready for exact-SHA promotion', () => {
  assert.deepEqual(evaluatePromotion(base), {
    state: 'PROMOTION_READY',
    action: 'PROMOTE_EXACT_SHA',
    candidate_sha: 'candidate123',
    last_known_good_sha: 'lkg123'
  });
});

test('missing authoritative production state fails closed before promotion or rollback', () => {
  const r = evaluatePromotion({ ...base, authoritative_production_state: undefined });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'VERIFY_PRODUCTION_STATE');
});

test('red candidate routes to repair rather than terminal failure', () => {
  const r = evaluatePromotion({ ...base, ci_status: 'red', retry_count_for_hypothesis: 1 });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'REPAIR_CANDIDATE');
});

test('two identical failed retries force a new hypothesis', () => {
  const r = evaluatePromotion({ ...base, ci_status: 'red', retry_count_for_hypothesis: 2 });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'CHANGE_HYPOTHESIS');
});

test('candidate head drift blocks promotion and requires re-verification', () => {
  const r = evaluatePromotion({ ...base, candidate_sha: 'candidate456', tested_head_sha: 'candidate123' });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'REVERIFY_CANDIDATE');
});

test('main drift requires candidate re-verification before promotion', () => {
  const r = evaluatePromotion({ ...base, current_main_sha: 'main456' });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'REVERIFY_ON_CURRENT_MAIN');
});

test('production red uses persisted LKG and ignores caller supplied rollback pointer', () => {
  const r = evaluatePromotion({ ...base, production_status: 'red' });
  assert.equal(r.state, 'ROLLBACK_REQUIRED');
  assert.equal(r.action, 'ROLLBACK_TO_LKG');
  assert.equal(r.last_known_good_sha, 'lkg123');
});

test('production red fails closed when persisted LKG equals current main', () => {
  const r = evaluatePromotion({
    ...base,
    production_status: 'red',
    authoritative_production_state: { ...authoritative, last_known_good_sha: 'main123' }
  });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'VERIFY_DISTINCT_LKG');
});

test('verified production exact SHA becomes green', () => {
  const r = evaluatePromotion({ ...base, production_status: 'green', production_sha: 'candidate123' });
  assert.equal(r.state, 'PRODUCTION_GREEN');
  assert.equal(r.action, 'NONE');
});

test('verified rollback becomes ROLLED_BACK_GREEN only when restored tree equals persisted LKG tree', () => {
  const r = evaluatePromotion({
    ...base,
    production_status: 'rolled_back_green',
    production_sha: 'lkg123',
    production_tree_sha: 'tree-lkg'
  });
  assert.equal(r.state, 'ROLLED_BACK_GREEN');
  assert.equal(r.action, 'NONE');
});

test('rollback completion with wrong tree remains open repair', () => {
  const r = evaluatePromotion({
    ...base,
    production_status: 'rolled_back_green',
    production_sha: 'lkg123',
    production_tree_sha: 'tree-wrong'
  });
  assert.equal(r.state, 'OPEN_REPAIR');
  assert.equal(r.action, 'VERIFY_ROLLBACK_TREE');
});

test('hard boundary is the only blocking terminal state', () => {
  const r = evaluatePromotion({ ...base, hard_boundary: true });
  assert.equal(r.state, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(r.action, 'NONE');
});
