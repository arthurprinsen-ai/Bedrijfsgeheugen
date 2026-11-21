import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SIGNAL_METRICS,parseSpokenRule,parseAmount,evaluateSignals,normalizeRule,buildSignalTask} from '../signal-detection.js';

test('spoken Dutch alerts become reviewable policies, not silent actions',()=>{
  assert.deepEqual(parseSpokenRule('Waarschuw me als omzet onder 50 duizend'),{metricId:'revenue',operator:'below',threshold:50000});
  assert.deepEqual(parseSpokenRule('geef een signaal als ziekteverzuim boven 7'),{metricId:'absence',operator:'above',threshold:7});
  assert.equal(parseAmount('1,5 miljoen'),1500000);
  assert.equal(parseSpokenRule('verwijder alle data'),null);
});
test('tenant and demo boundaries are fail closed',()=>{
  const rule={id:'one',metricId:'revenue',operator:'below',threshold:50,enabled:true};
  const state={portal:{metrics:{revenue:10}}};
  assert.deepEqual(evaluateSignals([rule],state,{authenticated:false}),[]);
  assert.deepEqual(evaluateSignals([rule],state,{authenticated:true,demo:true}),[]);
  assert.equal(evaluateSignals([rule],state,{authenticated:true})[0].status,'afwijking');
});
test('missing data never becomes a fabricated threshold anomaly',()=>{
  const rule={id:'one',metricId:'revenue',operator:'below',threshold:100,enabled:true};
  const result=evaluateSignals([rule],{portal:{metrics:{}}},{authenticated:true})[0];
  assert.equal(result.status,'geen-data');
  assert.equal(result.triggered,false);
  assert.equal(result.value,null);
  assert.equal(result.evidence.measurementUpdatedAt,null);
  assert.equal(result.evidence.freshness,'onbekend');
});
test('explicit missing-data rule is actionable with evidence',()=>{
  const result=evaluateSignals([{id:'one',metricId:'dso',operator:'missing',enabled:true}],{portal:{}},{authenticated:true})[0];
  assert.equal(result.status,'afwijking');
  assert.equal(result.triggered,true);
  assert.match(result.advice,/Controleer de bron/);
  assert.equal(result.actionPage,'waarde-financiering');
});
test('thresholds support zero and false never becomes zero',()=>{
  const state={portal:{metrics:{ebitda:0,revenue:false}}};
  const rules=[{id:'a',metricId:'ebitda',operator:'below',threshold:1},{id:'b',metricId:'revenue',operator:'below',threshold:1}];
  const results=evaluateSignals(rules,state,{authenticated:true});
  assert.equal(results[0].triggered,true);
  assert.equal(results[1].status,'geen-data');
});
test('unknown paths and invalid rules cannot be read',()=>{
  assert.equal(normalizeRule({id:'a',metricId:'serviceRoleKey',operator:'above',threshold:1}),null);
  assert.equal(normalizeRule({id:'a',metricId:'dso',operator:'above',threshold:Infinity}),null);
  assert.ok(SIGNAL_METRICS.every(metric=>metric.path.startsWith('portal.')));
});
test('V2 mounts one capability in original portal runtime and experience',async()=>{
  const app=await readFile(new URL('../app.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../experience.css',import.meta.url),'utf8');
  const ui=await readFile(new URL('../voice-signals.js',import.meta.url),'utf8');
  assert.match(app,/mountVoiceSignalCenter\(\{stateClient:portalStateClient,domainState:portalDomainState\}\)/);
  assert.match(css,/\.vs-dialog/);
  assert.match(ui,/domainState\.patch\('portal\.signalering'/);
  assert.match(ui,/domainState\.flush\(\)/);
  assert.match(ui,/stateClient\.isDemo/);
  assert.doesNotMatch(ui,/localStorage|sessionStorage|service_role/i);
  assert.doesNotMatch(ui,/new Worker|setInterval|Notification\.requestPermission/);
});

test('triggered signal creates an owned, dated task proposal only',()=>{
  const result=evaluateSignals([{id:'shortfall',metricId:'revenue',operator:'below',threshold:200}],{portal:{metrics:{revenue:100}}},{authenticated:true})[0];
  const task=buildSignalTask(result,{owner:'Eigenaar verkoop',due:'2026-11-30'});
  assert.equal(task.id,'portal-signal-shortfall');
  assert.equal(task.status,'Open');
  assert.equal(task.owner,'Eigenaar verkoop');
  assert.equal(task.evidence.sourcePath,'portal.metrics.revenue');
  assert.match(task.description,/Aanbevolen/);
  assert.throws(()=>buildSignalTask(result,{owner:'',due:'2026-11-30'}),/OWNER_REQUIRED/);
  assert.throws(()=>buildSignalTask(result,{owner:'A',due:'2026-11-99'}));
  assert.throws(()=>buildSignalTask({...result,triggered:false},{owner:'A',due:'2026-11-30'}),/NOT_TRIGGERED/);
});

test('cash alert reads the actual V2 financing source, not an orphan KPI field',()=>{
  const found=evaluateSignals([{id:'cash-low',metricId:'cash',operator:'below',threshold:1000}],{portal:{valueFinance:{cash:500}}},{authenticated:true})[0];
  assert.equal(found.value,500);
  assert.equal(found.triggered,true);
  assert.equal(found.evidence.sourcePath,'portal.valueFinance.cash');
});

test('original Heartbeat proof is visible only after authenticated on-demand tenant readback',async()=>{
  const ui=await readFile(new URL('../voice-signals.js',import.meta.url),'utf8');
  const css=await readFile(new URL('../experience.css',import.meta.url),'utf8');
  assert.match(ui,/\/api\/portal-signal-status/);
  assert.match(ui,/data-vs-proof-refresh/);
  assert.match(ui,/lastOriginalHeartbeatAt/);
  assert.match(ui,/lastTenantScanAt/);
  assert.match(ui,/proofEpoch\+\+/);
  assert.match(ui,/String\(authenticated\(\)\?\.user\?\.id/);
  assert.match(ui,/eligibleVoiceField\(target\)&&visibleVoiceControl\(target\)/);
  assert.match(ui,/stageVoiceFieldValue\(target,dictation\[1\]\)/);
  assert.match(css,/\.vs-proof/);
  assert.doesNotMatch(ui,/new Worker|setInterval|Notification\.requestPermission/);
  assert.doesNotMatch(ui,/GMAIL_SEND_EMAIL|service_role/);
});
