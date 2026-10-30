import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {summarizePredictiveRunEvidence,loadPredictiveRunEvidence} from '../brain/observability/predictive-run-evidence.mjs';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const time='2026-10-30T07:10:00Z';
const health=[{gemeten_op:'2026-10-30T07:02:15Z',status:'ok',detail:'signals=18; forecasts=1; rejected=0',gegevens:{private:'never exposed'}}];
const registry=[{maturity:'OBSERVED',evidence:{
  merged:true,source_parity:true,protected_merge_verified:true,
  production_runtime_verified:true,runtime_canary_proven:true,
  authorized_runtime_http:200,supabase_edge_version:569,
  next_natural_runtime_proven:false,forecast_outcome_proven:false,commercial_revenue_proven:false
}}];

test('successful canary does not fabricate natural learning, verified outcome, or revenue',()=>{
  const result=summarizePredictiveRunEvidence(health,registry,time);
  assert.equal(result.status,'RUN_READBACK_PROVEN');
  assert.equal(result.signals,18);
  assert.equal(result.forecasts,1);
  assert.equal(result.rejected,0);
  assert.equal(result.learningMaturity,'OBSERVED');
  assert.equal(result.nextNaturalRunProven,false);
  assert.equal(result.realizedOutcomeProven,false);
  assert.equal(result.commercialRevenueProven,false);
  assert.equal('private' in result,false);
  assert.equal(JSON.stringify(result).includes('never exposed'),false);
});

test('private or missing evidence cannot produce false green',()=>{
  const clone=value=>structuredClone(value);
  assert.equal(summarizePredictiveRunEvidence([],registry,time).status,'UNVERIFIED');
  assert.equal(summarizePredictiveRunEvidence(health,[],time).status,'UNVERIFIED');
  const missing=clone(registry);delete missing[0].evidence.protected_merge_verified;
  assert.equal(summarizePredictiveRunEvidence(health,missing,time).status,'UNVERIFIED');
  const failed=clone(health);failed[0].status='fout';
  assert.equal(summarizePredictiveRunEvidence(failed,registry,time).status,'UNVERIFIED');
  const noMarket=clone(health);noMarket[0].detail='signals=0; forecasts=0; rejected=0';
  assert.equal(summarizePredictiveRunEvidence(noMarket,registry,time).status,'UNVERIFIED');
  assert.equal(summarizePredictiveRunEvidence(health,registry,'2026-11-02T07:00:00Z').status,'UNVERIFIED');
});

test('read-only admin server projection fails closed and suppresses secrets',async()=>{
  const calls=[];
  const fetchImpl=async (url,options)=>{
    calls.push({url,options});
    return {ok:true,json:async()=>url.includes('bg_gezondheid?')?health:registry};
  };
  const result=await loadPredictiveRunEvidence({baseUrl:'https://example.supabase.co',key:'test-private',fetchImpl});
  assert.equal(result.status,'RUN_READBACK_PROVEN');
  assert.equal(calls.length,2);
  assert.ok(calls.every(x=>x.options.headers.authorization==='Bearer test-private'));
  assert.ok(calls.every(x=>x.url.startsWith('https://example.supabase.co/rest/v1/')));
  assert.equal(JSON.stringify(result).includes('test-private'),false);
  const denied=await loadPredictiveRunEvidence({baseUrl:'https://example.supabase.co',key:'secret',fetchImpl:async()=>({ok:false,status:403})});
  assert.equal(denied.status,'UNVERIFIED');
});

test('existing authenticated Portal V2 server and UI show bounded predictive evidence',()=>{
  const server=readFileSync(join(root,'netlify/functions/powerhouse-observability.mjs'),'utf8');
  const ui=readFileSync(join(root,'portal-v2/modules/powerhouse-observability.js'),'utf8');
  assert.match(server,/loadPredictiveRunEvidence/);
  assert.match(server,/predictiveRunEvidence,publicationEvidence/);
  assert.match(ui,/data-predictive-run-evidence/);
  assert.match(ui,/Natuurlijke vervolgrun/);
  assert.match(ui,/Echte forecast-uitkomst/);
  assert.match(ui,/Gerealiseerde omzet/);
  assert.match(ui,/prediction/i);
});
