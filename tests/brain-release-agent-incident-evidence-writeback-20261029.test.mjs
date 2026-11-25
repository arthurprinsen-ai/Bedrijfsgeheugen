import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const source=async file=>readFile(new URL(file,root),'utf8');

test('agent and continuity skill inherit canonical incident fingerprint and provider evidence truth',async()=>{
  const [agents,skill]=await Promise.all([source('AGENTS.md'),source('.agents/skills/powerhouse-continuity/SKILL.md')]);
  for(const text of [agents,skill]){
    assert.match(text,/powerhouse\|release-agent-incident-evidence\|20261029/);
    assert.match(text,/brain_failure_registry/);
    assert.match(text,/brain_failure_occurrences/);
    assert.match(text,/no (?:extra|tweede) scheduler|geen extra scheduler|geen tweede foutenregister/i);
  }
  assert.match(skill,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
  for(const fingerprint of [
    'portal|authenticated-two-tenant-production-proof|20261029',
    'powerhouse|website|checkout-trial-switch-dom|20261029',
    'github|pr-machine-metadata-literal-newline|20261029',
    'brain|learning-canonicalization|portal-path-shadow-canary|20261029',
    'powerhouse|external-search|tavily-plan-limit-432|20261029',
  ])assert.ok(skill.includes(fingerprint),fingerprint);
});

test('no success inflation: exact protected release, two tenants, provider source and customer proof stay distinct',async()=>{
 const [agents,skill]=await Promise.all([source('AGENTS.md'),source('.agents/skills/powerhouse-continuity/SKILL.md')]);
 assert.match(agents,/AUTHENTICATED_PRODUCTION_READBACK/);
 assert.match(agents,/REAL_CUSTOMER_OUTCOME/);
 assert.match(skill,/tenant_count_verified=2/);
 assert.match(skill,/cross_tenant_scope_verified=true/);
 assert.match(skill,/hygiene\/admission=success/);
 assert.match(skill,/historical_replay/);
 assert.match(skill,/shadow/);
 assert.match(skill,/canary/);
 assert.match(skill,/DATAFORSEO|DataForSEO/);
});

test('source learning is bounded and never advertises unverified release as live',async()=>{
 const data=JSON.parse(await source('brain/learning/2026-10-29-release-agent-incident-evidence-writeback.json'));
 assert.equal(data.fingerprint,'powerhouse|release-agent-incident-evidence|20261029');
 assert.equal(data.status,'CANDIDATE_NOT_LIVE');
 assert.equal(data.evidence.production_verified,false);
 assert.deepEqual(data.evaluation.historical_replay,['tests/brain-release-agent-incident-evidence-writeback-20261029.test.mjs']);
 assert.equal(data.compiler.machine_enforceable,true);
 assert.equal(data.compiler.security_sensitive,false);
});
