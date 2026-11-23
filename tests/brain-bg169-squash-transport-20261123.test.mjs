import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
const handoff=workflow.split('      - name: BG169 GitHub-native production transport')[1]||'';

test('BG169 uses the ONLY provider-allowed protected squash merge and checks policy',()=>{
 assert.ok(handoff,'the incumbent BG169 terminal transport must exist');
 assert.match(handoff,/allow_squash_merge/);
 assert.match(handoff,/BG169_SQUASH_MERGE_NOT_ALLOWED_BY_PROVIDER/);
 assert.match(handoff,/-f merge_method="squash"/);
 assert.doesNotMatch(handoff,/-f merge_method="merge"/);
 assert.match(handoff,/-f sha="\$HEAD_SHA"/);
 assert.match(handoff,/repos\/\$\{GITHUB_REPOSITORY\}\/pulls\/\$\{PR_NUMBER\}\/merge/);
});

test('squashed merge is verified by provider SHA and exact source Git tree, never merely an HTTP ACK',()=>{
 assert.match(handoff,/merged_sha="\$\(jq -r '\.sha \/\/ empty'/);
 assert.match(handoff,/git merge-base --is-ancestor "\$merged_sha" origin\/main/);
 assert.match(handoff,/if ! git merge-base --is-ancestor "\$HEAD_SHA" origin\/main/);
 assert.match(handoff,/candidate_tree="\$\(git rev-parse "\$HEAD_SHA\^\{tree\}"/);
 assert.match(handoff,/merged_tree="\$\(git rev-parse "\$merged_sha\^\{tree\}"/);
 assert.match(handoff,/BG169_SQUASH_TREE_NOT_EXACT/);
 assert.match(handoff,/merge_commit_sha \/\/ empty/);
 assert.match(handoff,/BG169_PROVIDER_MERGE_SHA_MISMATCH/);
 assert.match(handoff,/--arg merge_method "squash"/);
 assert.match(handoff,/--arg merged_sha "\$merged_sha"/);
});

test('existing BG169 terminal guards and irreversible action ordering remain intact',()=>{
 const check=handoff.indexOf('github-delivery-state-machine.mjs terminal-guard');
 const branch=handoff.indexOf('BG169_MAIN_EPOCH_DRIFT');
 const provider=handoff.indexOf('merge_response="$(gh api');
 assert.ok(check>=0&&branch>check&&provider>branch,'terminal admission and current-main CAS precede merge');
 for(const marker of [
  'BG169_SAME_REPOSITORY_REQUIRED',
  'BG169_HEAD_SHA_DRIFT',
  'BG169_DRAFT_BLOCKED',
  'BG169_GITHUB_NATIVE_MERGE_REJECTED',
  'BG169_PROMOTION_NOT_VERIFIED:PR_NOT_MERGED',
  'bg169-production-evidence.json'
 ])assert.ok(handoff.includes(marker),'missing original source control: '+marker);
 assert.match(workflow,/if: needs\.plan\.outputs\.has_lanes == 'true' && github\.event_name == 'workflow_dispatch' && inputs\.pr_number != '' && inputs\.verification_only != true/);
});
