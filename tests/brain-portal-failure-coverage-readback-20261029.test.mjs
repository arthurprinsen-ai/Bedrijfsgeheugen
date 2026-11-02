import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizeFailureCoverage,loadFailureCoverage} from '../brain/observability/failure-coverage-projection.mjs';
const sample=[
 {maturity:'OBSERVED',root_cause:null,regression_ref:'',prevention_rule:'  ',last_seen_at:'2026-10-29T10:00:00Z',fingerprint:'private-identifier'},
 {maturity:'PROVEN',root_cause:'internal text',regression_ref:'internal test',prevention_rule:'internal prevention'},
 {maturity:'VALIDATED',root_cause:'ok',regression_ref:'ok',prevention_rule:'ok'}
];
test('counts missing evidence without leaking underlying incident text',()=>{
 const result=summarizeFailureCoverage(sample,3,'2026-10-29T11:00:00Z');
 assert.equal(result.status,'READBACK_COMPLETE');
 assert.deepEqual([result.totals.patterns,result.totals.observed,result.totals.proven],[3,1,1]);
 assert.deepEqual([result.totals.observedMissingCause,result.totals.observedMissingRegression,result.totals.observedMissingPrevention],[1,1,1]);
 assert.equal(result.sourceLatestAt,'2026-10-29T10:00:00Z');
 assert.doesNotMatch(JSON.stringify(result),/private-identifier|internal text/);
});
test('partial or malformed evidence stays unverified',()=>{
 assert.equal(summarizeFailureCoverage(sample,4).status,'UNVERIFIED');
 assert.equal(summarizeFailureCoverage(sample,null).status,'UNVERIFIED');
 assert.equal(summarizeFailureCoverage([null],1).status,'UNVERIFIED');
});
test('read-only server provider readback supplies exact content-range and aggregate only',async()=>{
 const calls=[];
 const res=await loadFailureCoverage({baseUrl:'https://test.supabase.co',key:'example-key',fetchImpl:async(url,opts)=>{
   calls.push({url,opts});
   return {ok:true,headers:{get:()=> '0-2/3'},json:async()=>sample};
 }});
 assert.equal(res.status,'READBACK_COMPLETE');
 // Existing original provider projection intentionally has two read-only sources:
 // (1) exact-count aggregate, (2) one allowlisted predictive incident.
 // Both must remain private, bounded, and fail closed without a provider receipt.
 assert.equal(calls.length,2,'one aggregate and one allowlisted incident readback only');
 assert.equal(calls[0].opts.method,'GET');
 assert.equal(calls[0].opts.headers.prefer,'count=exact');
 assert.match(calls[0].url,/\/brain_failure_registry\?select=maturity,root_cause,regression_ref,prevention_rule,last_seen_at&limit=1000$/);
 assert.equal(calls[1].opts.method,'GET');
 assert.match(calls[1].url,/\/brain_failure_registry\?select=fingerprint,maturity,evidence,last_seen_at&fingerprint=eq\.predictive%7Cpublic-market%7Cunfiltered-top80-crowds-out-valid-source-types%7C20261030-v1&limit=1$/);
 assert.equal(calls[1].opts.headers.prefer,undefined,'second read must not claim an unrelated global count');
 assert.equal(res.predictiveRecovery.status,'UNVERIFIED','a nonmatching fixture may not become proven recovery');
 assert.doesNotMatch(JSON.stringify(res),/example-key|private-identifier|internal text/);
});
test('unavailable, denied and incomplete provider results never fabricate green',async()=>{
 assert.equal((await loadFailureCoverage({})).status,'UNAVAILABLE');
 assert.equal((await loadFailureCoverage({baseUrl:'https://example.com',key:'x',fetchImpl:async()=>({ok:false,status:403})})).status,'UNAVAILABLE');
 assert.equal((await loadFailureCoverage({baseUrl:'https://example.com',key:'x',fetchImpl:async()=>({ok:true,headers:{get:()=>null},json:async()=>sample})})).status,'UNVERIFIED');
});
test('admin-only portal endpoint includes incident aggregate; UI separates observed from verified',()=>{
 const api=fs.readFileSync('netlify/functions/powerhouse-observability.mjs','utf8');
 const ui=fs.readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/loadFailureCoverage\(/);
 assert.match(api,/systemMap:\{\.\.\.POWERHOUSE_SYSTEM_MAP,supabaseInventory,failureCoverage\}/);
 assert.match(ui,/data-brain-failure-coverage/);
 for(const name of ['observedMissingCause','observedMissingRegression','observedMissingPrevention','READBACK_COMPLETE']) assert.ok(ui.includes(name));
});

test('separate predictive incident provider failure cannot fabricate predictive recovery or clear a healthy aggregate',async()=>{
 const urls=[];
 const res=await loadFailureCoverage({
  baseUrl:'https://test.supabase.co',key:'test-secret',
  fetchImpl:async(url)=>{
   urls.push(url);
   if(url.includes('fingerprint=eq.'))return {ok:false,status:503};
   return {ok:true,headers:{get:()=> '0-2/3'},json:async()=>sample};
  }
 });
 assert.equal(urls.length,2);
 assert.equal(res.status,'READBACK_COMPLETE');
 assert.equal(res.predictiveRecovery.status,'UNVERIFIED');
 assert.equal(res.predictiveRecovery.reason,'INCIDENT_READBACK_HTTP_503');
 assert.doesNotMatch(JSON.stringify(res),/private-identifier|internal text|test-secret/);
});

test('denied aggregate readback stops before the second provider fetch',async()=>{
 const calls=[];
 const res=await loadFailureCoverage({
  baseUrl:'https://test.supabase.co',key:'test-secret',
  fetchImpl:async(url)=>{calls.push(url);return {ok:false,status:403};}
 });
 assert.equal(calls.length,1);
 assert.equal(res.status,'UNAVAILABLE');
 assert.equal(res.reason,'FAILURE_COVERAGE_HTTP_403');
 assert.equal(res.predictiveRecovery,undefined);
});
