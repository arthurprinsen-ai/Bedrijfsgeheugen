import fs from 'node:fs';
import assert from 'node:assert/strict';

const canaryPath='.github/workflows/repo-writer-cheap-canary.yml';
assert.ok(fs.existsSync(canaryPath),'cheap deterministic repository-writer canary workflow must exist');
const canary=fs.readFileSync(canaryPath,'utf8');

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
assert.match(canary,/-f pr_number=/);
assert.match(canary,/-f base_sha=/);
assert.match(canary,/-f head_sha=/);
assert.match(canary,/-f candidate_branch=/);
assert.match(canary,/git push origin "HEAD:refs\/heads\/\$CANDIDATE_BRANCH"/,'detached-head canary must publish an explicitly qualified branch ref');
assert.match(canary,/data\/regelgeving\.json/);
assert.match(canary,/blog\/writer-verification-weekblog/);
assert.match(canary,/sitemap\.xml/);
assert.doesNotMatch(canary,/ANTHROPIC_API_KEY|NOTION_TOKEN|NOTION_BLOG_DB|BG_SEO_WEBHOOK|api\.anthropic\.com/);
assert.doesNotMatch(canary,/git push origin HEAD:main|git push origin main|gh pr merge/);

console.log('PASS expensive/external writers use one deterministic candidate-only transport canary with agent-executable triggers');
