import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  deriveNetlifyDeploymentApplicability,NETLIFY_RUNTIME_EXACT,
  classifyNetlifyDeploymentEvidence
} from '../tools/delivery/netlify-deployment-applicability.mjs';

const policy=JSON.parse(readFileSync('config/brain-delivery-system.json','utf8'));
const original='platform/portal/powerhouse-existing-integration-read-model.mjs';
const sha='a'.repeat(40);

test('source actually bundled into original Netlify admin function always requires production deploy',()=>{
  assert.equal(NETLIFY_RUNTIME_EXACT.has(original),true);
  const result=deriveNetlifyDeploymentApplicability({
    changedPaths:[original,'tests/brain-innovation-sales-execution-readback-20261115.test.mjs',
      'brain/learning/2026-11-15-original-execution-week-census-v1.json'],
    headSha:sha,policy
  });
  assert.ok(result.runtimeChangedPaths.includes(original));
  assert.equal(result.netlifyRuntimeRequired,true);
  assert.equal(result.deploymentRequired,true);
  assert.equal(result.reason,'netlify-impact');
  const proof=classifyNetlifyDeploymentEvidence({
    applicability:result,headSha:sha,providerCommitSha:'b'.repeat(40),
    providerState:'ready'
  });
  assert.equal(proof.status,'PENDING');
  assert.equal(proof.productionVerified,false);
});

test('original Netlify selective-ignore reuses this authoritative runtime classifier',()=>{
  const siteConfig=readFileSync('netlify.toml','utf8');
  const ignore=readFileSync('tools/ci/netlify-ignore-build.mjs','utf8');
  const handler=readFileSync('netlify/functions/powerhouse-control-plane.mjs','utf8');
  assert.match(siteConfig,/ignore\s*=\s*"node \.\/tools\/ci\/netlify-ignore-build\.mjs"/);
  assert.match(ignore,/deriveNetlifyDeploymentApplicability\(\{changedPaths:changed,headSha:commit,policy\}\)/);
  assert.match(handler,/import \{ readPowerhouseIntegrationReadback \} from '\.\.\/\.\.\/platform\/portal\/powerhouse-existing-integration-read-model\.mjs';/);
});

test('audit coverage is added only AFTER original identity admin gate and cannot expose user or source data in headers',()=>{
  const handler=readFileSync('netlify/functions/powerhouse-control-plane.mjs','utf8');
  const role=handler.indexOf('if(!hasAdminRole(user))');
  const read=handler.indexOf('await readPowerhouseIntegrationReadback(');
  const header=handler.indexOf("responseWithAudit.headers.set('x-bg-innovation-audit-scope'");
  assert.ok(role>=0 && role<read && read<header);
  assert.match(handler,/scope==='FULL_LAST_7D'\|\|scope==='ABOVE_500_FAIL_CLOSED'\?scope:'UNKNOWN'/);
  assert.match(handler,/return responseWithAudit;/);
  const onlyGovernance=deriveNetlifyDeploymentApplicability({
    changedPaths:['docs/changes/one.md','.agents/skills/one/SKILL.md'],
    headSha:sha,policy
  });
  assert.equal(onlyGovernance.deploymentRequired,false,
    'governance-only changes still remain excluded from needless Netlify builds');
});
