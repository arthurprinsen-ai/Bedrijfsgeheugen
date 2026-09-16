import test from 'node:test';
import assert from 'node:assert/strict';
import {selectTests,testReliability,evaluateBudget,rollbackProof,detectWorkConflict,projectScorecard} from '../tools/ci/engineering-intelligence.mjs';

test('test selection always includes safety kernel and impacted tests',()=>assert.deepEqual(selectTests(['portal/x'],{safetyKernel:['safety'],rules:[{path:'portal/',tests:['portal']}],fullLane:['all']}),['portal','safety']));
test('unknown change falls back conservatively',()=>assert.deepEqual(selectTests(['unknown/x'],{safetyKernel:['safety'],rules:[],fullLane:['all']}),['all','safety']));
test('flaky intelligence fingerprints and only quarantines with owner',()=>{const x=testReliability({test:'x',failure:'boom',runs:10,failures:3,owner:'agent'});assert.equal(x.quarantine,true);assert.equal(x.fingerprint.length,64)});
test('performance regression blocks at > ratchet',()=>assert.equal(evaluateBudget({baseline:100,current:140}).status,'REGRESSION_BLOCK'));
test('historical metric without baseline becomes baseline debt',()=>assert.equal(evaluateBudget({baseline:null,current:100}).status,'BASELINE_DEBT'));
test('rollback proof must be recent',()=>assert.equal(rollbackProof({lastProvenAt:'2020-01-01T00:00:00Z',maxAgeMs:1000,now:Date.parse('2026-01-01T00:00:00Z')}).ok,false));
test('work graph catches authority conflicts',()=>assert.equal(detectWorkConflict([{changeId:'a',component:'portal',authorities:['schema'],expiresAt:'2099-01-01T00:00:00Z'}],{changeId:'b',component:'website',authorities:['schema']}).ok,false));
test('scorecard projects DORA measures from existing events',()=>{const s=projectScorecard([{type:'deployment',leadTimeMs:10},{type:'deployment',leadTimeMs:30,failed:true},{type:'recovery',durationMs:50}]);assert.equal(s.deployment_frequency,2);assert.equal(s.lead_time_ms,20);assert.equal(s.change_failure_rate,.5);assert.equal(s.recovery_time_ms,50)});
