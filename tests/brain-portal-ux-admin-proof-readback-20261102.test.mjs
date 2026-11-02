import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {summarizePortalUxReleaseProof,loadPortalUxReleaseProof} from '../brain/observability/portal-ux-release-proof.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const now=new Date('2026-11-02T14:15:00Z');
const state={
 release:'LIVE_SOURCE_AND_BROWSER_PROVEN',
 original_ux_browser_result:'PASS_15_SKIPPED_1',
 production_sha:'833bcec12adf9b3e0aaa3943adb268657be4ad43',
 original_ux_release_sha:'75c4500a4e90afa1f001f748d7081a75e09aa803',
 netlify_deploy:'6ae895962b2f40deba38943c',
 security_diagnostic_status:'MERGED_POSTMERGE_BACKEND_AND_PORTAL_PASS_NOT_YET_PUBLISHED',
 wcag_22_aa_independent_audit:'EVIDENCE_DUE',
 real_entrepreneur_usability:'EVIDENCE_DUE',
 authenticated_two_tenant_tests:'EVIDENCE_DUE',
 award_readiness:'NOT_ASSESSED',private_person_key:'DO_NOT_LEAK'
};
const rows=[{subject_id:'portal-v2-living-interface-ux-v1',environment:'production',observed_at:'2026-11-02T14:02:36Z',valid_until:'2026-11-03T14:02:36Z',artifact_version:state.production_sha,observed_state:state,evidence:{private_token:'DO_NOT_LEAK'}}];
test('original ONE BRAIN private record yields only allowlisted statuses',()=>{
 const summary=summarizePortalUxReleaseProof(rows,{now});
 assert.equal(summary.status,'READBACK_COMPLETE');
 assert.equal(summary.evidenceStatus,'REGISTERED_NOT_INDEPENDENTLY_DEPLOY_VERIFIED');
 assert.equal(summary.acceptance.tenants,'EVIDENCE_DUE');
 assert.equal(summary.securityDiagnostic,'MERGED_POSTMERGE_BACKEND_AND_PORTAL_PASS_NOT_YET_PUBLISHED');
 assert.equal(summary.productionSha,state.production_sha);
 assert.ok(!JSON.stringify(summary).includes('DO_NOT_LEAK'));
});
test('expired, future, invalid and mismatched versions fail closed',()=>{
 assert.equal(summarizePortalUxReleaseProof(rows,{now:new Date('2026-11-04T00:00:00Z')}).status,'UNVERIFIED');
 assert.equal(summarizePortalUxReleaseProof([{...rows[0],artifact_version:state.original_ux_release_sha}],{now}).status,'UNVERIFIED');
 assert.equal(summarizePortalUxReleaseProof([{...rows[0],environment:'public'}],{now}).status,'UNVERIFIED');
 assert.equal(summarizePortalUxReleaseProof([],{now}).status,'UNVERIFIED');
 assert.equal(summarizePortalUxReleaseProof([{...rows[0],observed_at:'2026-12-01T00:00:00Z'}],{now}).status,'UNVERIFIED');
});
test('server read is allowlisted, bounded and never forwards raw evidence',async()=>{
 let seenUrl='';
 const result=await loadPortalUxReleaseProof({baseUrl:'https://example.supabase.co/',key:'SERVER_PRIVATE_TEST_KEY',now,fetchImpl:async(url,opts)=>{
  seenUrl=String(url);
  assert.equal(opts.method,'GET');
  assert.ok(opts.headers.authorization.startsWith('Bearer '));
  return {ok:true,json:async()=>rows};
 }});
 assert.equal(result.status,'READBACK_COMPLETE');
 assert.ok(seenUrl.includes('brain_observed_states'));
 assert.ok(seenUrl.includes('subject_id=eq.portal-v2-living-interface-ux-v1'));
 assert.ok(!seenUrl.includes('private_token'));
 assert.equal((await loadPortalUxReleaseProof({baseUrl:'',key:'',now})).status,'UNVERIFIED');
});
test('only the original admin + tenant gate can call observation loader, and card cross-checks public Netlify SHA',()=>{
 const api=read('netlify/functions/powerhouse-observability.mjs');
 const client=read('portal-v2/modules/powerhouse-observability.js');
 assert.ok(api.indexOf('isPowerhouseAdmin(user')<api.indexOf('loadPortalUxReleaseProof({'));
 assert.ok(api.indexOf('resolveIdentityTenant(user)')<api.indexOf('loadPortalUxReleaseProof({'));
 assert.match(api,/cache-control':'private, no-store'/);
 assert.match(api,/portalUxReleaseProof/);
 assert.match(client,/data-portal-ux-proof/);
 assert.match(client,/proof\.productionSha===published/);
 assert.match(client,/PRODUCTION_SOURCE_RECHECK_DUE/);
 assert.ok(!client.includes('private_person_key'));
 assert.match(read('.agents/skills/portal-living-interface/SKILL.md'),/Operator UX evidence/);
});
