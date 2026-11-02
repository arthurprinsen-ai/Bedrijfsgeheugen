import test from 'node:test';
import assert from 'node:assert/strict';
import {securityEvidenceCurrent,summarizeSecurityPlatforms,securityOverallPosture} from '../portal-v2/modules/security-trust-workspace.js';

const NOW=Date.parse('2026-11-02T14:00:00Z');
const day=24*60*60*1000;
const record=(overrides={})=>({
 provider_key:'GITHUB',control_key:'CODEQL',status:'PASS',evidence_available:true,
 observed_at:new Date(NOW-60_000).toISOString(),
 expires_at:new Date(NOW+60*60_000).toISOString(),...overrides
});

test('security evidence requires authentic proof, absolute expiry and bounded freshness',()=>{
 assert.equal(securityEvidenceCurrent(record(),NOW),true);
 const failures=[
  {expires_at:null},{expires_at:''},{observed_at:null},{observed_at:'not-a-date'},
  {expires_at:new Date(NOW-1).toISOString()},
  {observed_at:new Date(NOW-day-1).toISOString()},
  {observed_at:new Date(NOW+6*60_000).toISOString()},
  {expires_at:new Date(NOW+day+2).toISOString()},
  {evidence_available:false},{status:'NOT_VERIFIED'},
 ];
 for(const mutation of failures)assert.equal(securityEvidenceCurrent(record(mutation),NOW),false,JSON.stringify(mutation));
});

test('a full provider row set is NOT green if any piece lacks usable expiry evidence',()=>{
 const good=['CODEQL','BRANCH_PROTECTION','SECRET_SCANNING'].map(control_key=>record({control_key}));
 const first=summarizeSecurityPlatforms(good,NOW)[0];
 assert.equal(first.status,'VERIFIED');
 assert.equal(first.current,3);
 const incomplete=[...good.slice(0,2),{...good[2],expires_at:null}];
 const outcome=summarizeSecurityPlatforms(incomplete,NOW)[0];
 assert.equal(outcome.status,'EVIDENCE_PARTIAL');
 assert.equal(outcome.observed,3);
 assert.equal(outcome.current,2);
 assert.equal(securityOverallPosture({postureStatus:'VERIFIED_NO_OPEN_FINDINGS'},incomplete,NOW),'EVIDENCE_PARTIAL');
 const failed=[...good.slice(0,2),{...good[2],status:'FAIL'}];
 assert.equal(summarizeSecurityPlatforms(failed,NOW)[0].status,'ACTION_REQUIRED');
});

test('retrospective evidence with long self-declared validity cannot be trusted as current',()=>{
 const old=record({observed_at:new Date(NOW-day+1_000).toISOString(),expires_at:new Date(NOW+60_000).toISOString()});
 assert.equal(securityEvidenceCurrent(old,NOW),false);
});
