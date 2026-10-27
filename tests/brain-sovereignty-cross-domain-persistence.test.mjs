import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildSovereigntyChangeImpact} from '../platform/regulatory/sovereignty-change-impact.mjs';
import {CURRENT_AI_DEPLOYMENT_PROFILE} from '../platform/policy/customer-ai-deployment.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const previous={policy_version:5,mode:'TRANSPARENT_GLOBAL',preferred_ai_provider:null,preferred_ai_region:null,ai_deployment_profile:CURRENT_AI_DEPLOYMENT_PROFILE};
const next={mode:'TRANSPARENT_GLOBAL',preferredAiProvider:null,preferredAiRegion:null,aiDeploymentProfile:{...CURRENT_AI_DEPLOYMENT_PROFILE,provider:'MISTRAL_API',modelFamily:'MISTRAL'}};
test('AI model swap creates a tenant-scoped versioned CSRD/ESRS review, not a fake measurement',()=>{
 const {impact,expectedPolicyVersion}=buildSovereigntyChangeImpact({tenantId:'tenant-a',actor:'member-a',previousPolicy:previous,proposedPolicy:next});
 assert.equal(expectedPolicyVersion,5);
 assert.equal(impact.changeId,'sovereignty:tenant-a:6');
 assert.equal(impact.kind,'AI_MODEL');
 assert.equal(impact.status,'REVIEW_REQUIRED');
 assert.equal(impact.deploymentApproved,false);
 assert.ok(impact.affectedDomains.includes('csrd_esrs_scope'));
 assert.ok(impact.affectedDomains.includes('privacy'));
 assert.ok(impact.esrsReview.some(x=>x.standard==='ESRS_E1'&&x.materiality==='UNDETERMINED'&&x.measuredImpact===null));
});
test('residency-only change reaches security, privacy and sustainability',()=>{
 const {impact}=buildSovereigntyChangeImpact({tenantId:'tenant-b',actor:'member-b',previousPolicy:previous,proposedPolicy:{mode:'EU_ONLY',preferredAiProvider:null,preferredAiRegion:'EU',aiDeploymentProfile:CURRENT_AI_DEPLOYMENT_PROFILE}});
 assert.equal(impact.kind,'DATA_LOCATION');
 assert.equal(impact.before.mode,'TRANSPARENT_GLOBAL');
 assert.equal(impact.after.mode,'EU_ONLY');
 assert.ok(impact.affectedDomains.includes('security'));
 assert.ok(impact.affectedDomains.includes('sustainability'));
});
test('unchanged policy is idempotent even when the JSON profile keys are ordered differently',()=>{
 const reordered=Object.fromEntries(Object.entries(CURRENT_AI_DEPLOYMENT_PROFILE).reverse());
 const {impact,expectedPolicyVersion}=buildSovereigntyChangeImpact({tenantId:'tenant-a',actor:'member-a',previousPolicy:previous,proposedPolicy:{mode:previous.mode,preferredAiProvider:null,preferredAiRegion:null,aiDeploymentProfile:reordered}});
 assert.equal(impact,null);
 assert.equal(expectedPolicyVersion,5);
});
test('an omitted profile preserves current requested placement and does not invent a change',()=>{
 const {impact}=buildSovereigntyChangeImpact({tenantId:'tenant-a',actor:'member-a',previousPolicy:previous,proposedPolicy:{mode:previous.mode}});
 assert.equal(impact,null);
});
test('API writes tenant authoritative assessment and Edge validates previous state before commit',async()=>{
 const api=await read('netlify/functions/data-sovereignty.mjs');
 assert.match(api,/buildSovereigntyChangeImpact/);
 assert.match(api,/client\.get\(ownTenant\)/);
 assert.match(api,/expectedPolicyVersion,changeImpact:impact/);
 const edge=await read('supabase/functions/portal-state-eu/index.ts');
 assert.match(edge,/INVALID_CROSS_DOMAIN_IMPACT/);
 assert.match(edge,/SOVEREIGNTY_POLICY_VERSION_CONFLICT/);
 assert.match(edge,/last_change_impact:changed\?incomingImpact/);
 assert.match(edge,/\.eq\('policy_version',currentVersion\)/);
 const sql=await read('supabase/migrations/20261008130500_sovereignty_cross_domain_impact_ledger_v1.sql');
 assert.match(sql,/tenant_data_sovereignty_change_impact_v1/);
 assert.match(sql,/create trigger tenant_sovereignty_change_impact_v1/i);
 assert.match(sql,/enable row level security/i);
 assert.match(sql,/grant select on public\.tenant_data_sovereignty_change_impact_v1 to service_role/i);
 assert.doesNotMatch(sql,/grant .*insert.*to (anon|authenticated)/i);
});
