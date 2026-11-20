import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSpokenRule,evaluateSignals,buildSignalTask} from '../portal-v2/signal-detection.js';

test('historical replay: no unauthorized tenant observation can become a customer signal',()=>{
 const rules=[{id:'revenue-guard',metricId:'revenue',operator:'below',threshold:1000}];
 const recorded={portal:{metrics:{revenue:500}}};
 assert.equal(evaluateSignals(rules,recorded,{authenticated:false}).length,0);
 assert.equal(evaluateSignals(rules,recorded,{authenticated:true,demo:true}).length,0);
 assert.equal(evaluateSignals(rules,recorded,{authenticated:true})[0].status,'afwijking');
});
test('historical replay: missing KPI never proves a threshold breach',()=>{
 const signal=evaluateSignals([{id:'warning',metricId:'revenue',operator:'below',threshold:1000}],{portal:{metrics:{}}},{authenticated:true})[0];
 assert.equal(signal.status,'geen-data');
 assert.equal(signal.triggered,false);
 assert.equal(signal.evidence.freshness,'onbekend');
});
test('historical replay: voice creates reviewable rule but cannot silently persist',()=>{
 assert.deepEqual(parseSpokenRule('waarschuw me als omzet onder 50 duizend'),{metricId:'revenue',operator:'below',threshold:50000});
 assert.equal(parseSpokenRule('verwijder de boekhouding'),null);
});
test('historical replay: assigned, sourced action requires triggered signal and explicit owner and due date',()=>{
 const signal=evaluateSignals([{id:'revenue-guard',metricId:'revenue',operator:'below',threshold:1000}],{portal:{metrics:{revenue:500}}},{authenticated:true})[0];
 assert.throws(()=>buildSignalTask(signal,{owner:'',due:'2026-11-30'}),/OWNER_REQUIRED/);
 const task=buildSignalTask(signal,{owner:'Operationeel verantwoordelijke',due:'2026-11-30'});
 assert.equal(task.status,'Open');
 assert.equal(task.evidence.kind,'PORTAL_USER_DEFINED_THRESHOLD');
 assert.equal(task.owner,'Operationeel verantwoordelijke');
 assert.equal(task.due,'2026-11-30');
});
