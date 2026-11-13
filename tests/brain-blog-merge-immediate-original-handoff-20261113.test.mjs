import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const get=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const workflow=get('.github/workflows/powerhouse-daily-blog.yml');
const producer=get('tools/content-growth/reconcile-merged-blog-live.mjs');
const agent=get('platform/agents/agent-team.mjs');
const skill=get('.agents/skills/powerhouse-social-cro-funnel/SKILL.md');

test('original hourly blog workflow is also triggered by protected main blog changes without another executor',()=>{
  assert.match(workflow,/on:\s*\n\s*schedule:/);
  assert.match(workflow,/cron:\s*'11 \* \* \* \*'/);
  assert.match(workflow,/push:\s*\n\s*branches:\s*\[main\][\s\S]{0,380}- 'blog\/\*\*'/);
  assert.match(workflow,/concurrency:\s*\n\s*group:\s*powerhouse-daily-blog\s*\n\s*cancel-in-progress:\s*false/);
  assert.equal(workflow.split('node tools/content-growth/reconcile-merged-blog-live.mjs "$BUSINESS_DATE"').length-1,1);
  assert.match(workflow,/Reconcile merged daily blog only after production HTTP and immutable release proof/);
  assert.match(workflow,/if: always\(\) && steps\.day\.outputs\.run == 'true'/);
});
test('existing same-day writer skips a second blog PR once protected merge is present',()=>{
  assert.match(workflow,/SAME_DATE_BLOG_PROTECTED_MERGE_PRESENT/);
  assert.match(workflow,/echo "available=false" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow,/gh pr merge "\$pr" --auto --squash/);
});
test('Netlify ready alone never closes blog; original public HTML and signed provider receipt remain mandatory',()=>{
  for(const term of ['BLOG_PROOF_RELEASE_AUTHORITY_REQUIRED','BLOG_PROOF_MERGE_NOT_IN_LIVE_RELEASE','BLOG_PROOF_PAGE_NOT_HTML_200','BLOG_PROOF_WRONG_PUBLIC_PAGE_OR_FALLBACK','rpc/record_content_publication_state','BLOG_PROOF_DATABASE_READBACK_FAILED'])assert.ok(producer.includes(term));
  assert.match(producer,/public_http_status:200/);
  assert.match(producer,/netlify_deploy_id:String\(release\.deploy_id\)/);
  assert.ok(skill.includes('BLOG_MERGE_PUSH_ORIGINAL_OWNER_RECEIPT_20261113'));
  assert.ok(skill.includes('DEPLOYED_WAITING_HTTP_CONSUMER_ACK'));
  assert.equal(agent.split('verify-merged-blog-release-triggers-original-immediate-public-html-consumer-ack').length-1,1);
});
