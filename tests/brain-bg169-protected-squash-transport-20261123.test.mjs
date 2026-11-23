import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const yaml=readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
const handoff=yaml.split('- name: BG169 GitHub-native production transport')[1]?.split('- name: Publish BG169 production evidence')[0]||'';

test('real repository squash-only policy is checked before original BG169 native merge',()=>{
 assert.ok(handoff);
 assert.ok(handoff.includes('BG169_SQUASH_DISABLED_BY_REPOSITORY'));
 assert.ok(handoff.includes('.allow_squash_merge // false'));
 assert.ok(handoff.includes('merge_method="squash"'));
 assert.ok(!handoff.includes('merge_method="merge"'));
 assert.ok(handoff.includes('-f sha="$HEAD_SHA"'));
 assert.ok(handoff.includes('BG169_GITHUB_NATIVE_MERGE_REJECTED'));
});
test('exact real GitHub squash identity must prove unchanged candidate tree and exact premerge main parent',()=>{
 for(const check of [
  'merged_sha="$(jq -r',
  'candidate_tree="$(git rev-parse "$HEAD_SHA^{tree}")"',
  'merged_tree="$(git rev-parse "$merged_sha^{tree}")"',
  '"$merged_tree" = "$candidate_tree"',
  'first_parent="$(git rev-parse "$merged_sha^")"',
  '"$first_parent" = "$rollback_identity"',
  'git merge-base --is-ancestor "$merged_sha" origin/main',
  'BG169_PROMOTION_NOT_VERIFIED:TREE_DRIFT',
  'BG169_PROMOTION_NOT_VERIFIED:PREMERGE_MAIN_PARENT_DRIFT',
  'BG169_PROMOTION_NOT_VERIFIED:MERGE_NOT_IN_MAIN',
 ]) assert.ok(handoff.includes(check), 'missing protected squash proof: '+check);
 assert.ok(!handoff.includes('git merge-base --is-ancestor "$HEAD_SHA" origin/main'),'squash does not preserve feature ancestry');
});
test('do not green a PR commit or a successful transport ACK without independent GitHub and evidence identity',()=>{
 for(const check of [
  'BG169_MAIN_EPOCH_DRIFT',
  'BG169_HEAD_SHA_DRIFT_BEFORE_MERGE',
  'CANONICAL_SUCCESSOR_EXISTS',
  'PR_NOT_MERGED',
  'PR_MERGE_SHA_MISMATCH',
  '--arg merge_commit_sha "$merged_sha"',
  '--arg verified_candidate_tree "$candidate_tree"',
  'execution_proof:true,verified:true',
 ]) assert.ok(handoff.includes(check),'missing exact protected release guard: '+check);
 assert.ok(handoff.indexOf('PR_MERGE_SHA_MISMATCH')<handoff.indexOf('execution_proof:true,verified:true'));
 assert.ok(handoff.includes('transport="github-native"'));
});
test('BG169 transport remains explicit production-only, original guard and security protected',()=>{
 assert.ok(yaml.includes("github.event_name == 'workflow_dispatch'"));
 assert.ok(yaml.includes('inputs.verification_only != true'));
 assert.ok(yaml.includes('Certify live main protection before production handoff'));
 assert.ok(yaml.includes('node tools/delivery/github-delivery-state-machine.mjs terminal-guard'));
 assert.ok(!handoff.includes('transport="make"'));
 assert.ok(!handoff.includes('BG169_HANDOFF_URL'));
});
