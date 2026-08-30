import fs from 'node:fs';
import assert from 'node:assert/strict';

const canaryPath='.github/workflows/repo-writer-cheap-canary.yml';
const shadowPath='.github/workflows/repo-writer-candidate-shadow.yml';
const gatePath='.github/workflows/repo-writer-gate-dispatch.yml';
const unifiedPath='.github/workflows/unified-brain-delivery.yml';
for (const path of [canaryPath, shadowPath, gatePath, unifiedPath]) assert.ok(fs.existsSync(path),`${path} must exist`);
const canary=fs.readFileSync(canaryPath,'utf8');
const shadow=fs.readFileSync(shadowPath,'utf8');
const gate=fs.readFileSync(gatePath,'utf8');
const unified=fs.readFileSync(unifiedPath,'utf8');

for(const writer of ['regelgeving-bijwerken','seo-controle','weekblog']){
  assert.match(canary,new RegExp(writer.replaceAll('-','\\-')),`${writer} must be supported by cheap canary`);
  assert.match(canary,new RegExp(`verify-cheap/${writer.replaceAll('-','\\-')}-\\*`),`${writer} must have agent-executable PR trigger`);
}
assert.match(canary,/workflow_dispatch:/);
assert.match(canary,/pull_request:/);
assert.match(canary,/brain\/evidence\/writer-canary-trigger\/\*\.json/);
assert.match(canary,/github\.event\.pull_request\.base\.sha/);
assert.match(canary,/github\.head_ref/);
assert.match(canary,/createWriterCandidate/);
assert.match(canary,/validateWriterCandidate/);
assert.match(canary,/gh pr create/);
assert.match(canary,/repo-writer-candidate-shadow\.yml/);
assert.match(canary,/unified-brain-delivery\.yml/,'cheap canary must dispatch Unified Brain Delivery after immutable shadow dispatch');
assert.match(canary,/-f verification_only=true/,'cheap canary direct Unified dispatch must be verification-only');
assert.match(canary,/repo-writer-candidate-shadow\.yml[\s\S]*-f verification_only=true/,'cheap canary must mark immutable shadow dispatch verification-only');

assert.match(shadow,/verification_only:/,'shadow workflow must declare verification-only input');
assert.match(shadow,/repo-writer-gate-dispatch\.yml[\s\S]*-f verification_only="\$VERIFICATION_ONLY"/,'shadow must propagate verification-only state to central gates');
assert.match(shadow,/VERIFICATION_ONLY: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.verification_only \|\| false \}\}/,'shadow propagation must derive only from explicit dispatch input');

assert.match(gate,/verification_only:/,'central gate workflow must declare verification-only input');
assert.match(gate,/unified-brain-delivery\.yml[\s\S]*-f verification_only="\$VERIFICATION_ONLY"/,'central gates must propagate verification-only state to Unified Brain');
assert.match(gate,/VERIFICATION_ONLY: \$\{\{ inputs\.verification_only \}\}/,'central gate dispatch must bind exact verification-only input');

assert.match(unified,/verification_only:/,'Unified Brain workflow must declare verification-only dispatch input');
assert.match(unified,/inputs\.verification_only != true/,'BG169 production handoff must be impossible for verification-only dispatches');
assert.match(unified,/Verification-only delivery: production authority handoff intentionally skipped\./,'verification-only runs must emit explicit non-promotion evidence');
assert.match(canary,/git push origin "HEAD:refs\/heads\/\$CANDIDATE_BRANCH"/,'detached-head canary must publish an explicitly qualified branch ref');
assert.match(canary,/data\/regelgeving\.json/);
assert.match(canary,/blog\/writer-verification-weekblog/);
assert.match(canary,/sitemap\.xml/);
assert.doesNotMatch(canary,/ANTHROPIC_API_KEY|NOTION_TOKEN|NOTION_BLOG_DB|BG_SEO_WEBHOOK|api\.anthropic\.com/);
assert.doesNotMatch(canary,/git push origin HEAD:main|git push origin main|gh pr merge/);

console.log('PASS verification-only writer safety propagates cheap canary -> immutable shadow -> central gates -> Unified Brain -> no BG169');
