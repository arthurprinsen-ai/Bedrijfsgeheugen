import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/powerhouse-delivery-hygiene.yml','utf8');

test('synchronize admission reads live PR body before terminal lease validation',()=>{
  const liveFetch="const pr = await gh(\`repos/\${process.env.GITHUB_REPOSITORY}/pulls/\${prNumber}\`);";
  const headReadback="if (String(pr.head?.sha || '') !== headSha)";
  const liveBody="const livePrBody = String(pr.body || process.env.EVENT_PR_BODY || '');";
  const leaseParse="const eventLease = parseWriterLease(livePrBody);";

  const fetchIndex=workflow.indexOf(liveFetch);
  const headIndex=workflow.indexOf(headReadback);
  const bodyIndex=workflow.indexOf(liveBody);
  const leaseIndex=workflow.indexOf(leaseParse);

  assert.ok(fetchIndex>=0);
  assert.ok(headIndex>fetchIndex);
  assert.ok(bodyIndex>headIndex);
  assert.ok(leaseIndex>bodyIndex);
  assert.equal((workflow.match(/const pr = await gh\(/g)||[]).length,1);
  assert.doesNotMatch(workflow,/parseWriterLease\(process\.env\.EVENT_PR_BODY/);
});
