import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveRegulatoryChangeImpact, applyRegulatoryChangesToControls } from '../platform/regulatory/regulatory-change-impact.mjs';
import { beoordeelControl, STATUS } from '../portal-v2/compliance-engine.js';

test('AI Act source change propagates through risk actions finance cockpit and brain',()=>{
  const impact=deriveRegulatoryChangeImpact({sourceId:'eu-ai-act',framework:'EU_AI_ACT',previousSha256:'a',currentSha256:'b',observedAt:'2026-09-18T18:00:00Z'});
  assert.equal(impact.reviewRequired,true);
  for(const domain of ['compliance.eu_ai_act','risk.register','actions','finance','executive.cockpit','advice','powerhouse.brain'])
    assert.ok(impact.organism.recomputeDomains.includes(domain),domain);
});

test('unchanged regulatory source creates no recompute event',()=>{
  const impact=deriveRegulatoryChangeImpact({sourceId:'eu-ai-act',framework:'EU_AI_ACT',previousSha256:'a',currentSha256:'a'});
  assert.equal(impact.changed,false);
  assert.equal(impact.organism,null);
});

test('framework change invalidates an older verified control until re-reviewed',()=>{
  const [control]=applyRegulatoryChangesToControls([{
    id:'AI-TRANSPARENCY',framework:'EU_AI_ACT',applicability:'applicable',control:{implemented:true},
    verifiedAt:'2026-09-01T00:00:00Z',evidence:[{id:'e1',verified:true}]
  }],[{framework:'EU_AI_ACT',changed:true,observedAt:'2026-09-18T18:00:00Z'}]);
  const assessed=beoordeelControl(control,{nu:new Date('2026-09-18T19:00:00Z')});
  assert.equal(assessed.status,STATUS.EVIDENCE_MISSING);
  assert.equal(assessed.regulatoryReviewRequired,true);
});

test('new verification after baseline change may become verified again',()=>{
  const assessed=beoordeelControl({
    id:'CBW-RISK',framework:'NIS2_CBW',applicability:'applicable',control:{implemented:true},
    regulatoryChangedAt:'2026-09-18T10:00:00Z',verifiedAt:'2026-09-18T12:00:00Z',
    evidence:[{id:'e1',verified:true}]
  },{nu:new Date('2026-09-18T19:00:00Z')});
  assert.equal(assessed.status,STATUS.VERIFIED);
});

import fs from 'node:fs';

test('regulatory source registry contains only configured official authorities',()=>{
  const cfg=JSON.parse(fs.readFileSync('config/regulatory-sources.json','utf8'));
  assert.ok(cfg.sources.length>=4);
  for(const source of cfg.sources){
    const host=new URL(source.url).hostname;
    assert.ok(['eur-lex.europa.eu','www.ncsc.nl','www.rijksoverheid.nl'].includes(host),host);
    assert.ok(source.framework);
  }
});

test('watcher persists exact raw bytes before interpretation projection',()=>{
  const monitor=fs.readFileSync('tools/regulatory-source-monitor.py','utf8');
  const ingest=fs.readFileSync('tools/regulatory-brain-ingest.py','utf8');
  const workflow=fs.readFileSync('.github/workflows/regulatory-source-watch.yml','utf8');
  assert.match(monitor,/rawSha256/);
  assert.match(monitor,/write_bytes\(result\['raw'\]\)/);
  assert.match(ingest,/raw_body_gzip_base64/);
  assert.match(ingest,/powerhouse_record_source_observation_v1/);
  assert.match(monitor,/powerhouse-regulatory-check-run-v1/);
  assert.match(ingest,/powerhouse-regulatory-source-check-v1/);
  assert.match(ingest,/freshness_heartbeat/);
  assert.match(ingest,/regulatory-content:/);
  assert.ok(workflow.indexOf('Persist source heartbeat and immutable raw observations in Powerhouse Brain') < workflow.indexOf('Open governed source-state candidate'));
});

test('interpretation updater is driven by canonical source-state changes',()=>{
  const workflow=fs.readFileSync('.github/workflows/regelgeving-bijwerken.yml','utf8');
  assert.match(workflow,/data\/regulatory-source-state\.json/);
  assert.match(workflow,/Delivery-Lane: automation/);
  assert.match(workflow,/Candidate-Type: implementation/);
  assert.match(workflow,/Regulatory-Candidate-Type: interpretation-review/);
  assert.match(workflow,/schedule:[\s\S]*?cron:\s*['\"]30 4 \* \* 1['\"]/);
});


test('regulatory source watcher and interpretation safety-net remain periodic while source changes trigger immediately',()=>{
  const watcher=fs.readFileSync('.github/workflows/regulatory-source-watch.yml','utf8');
  const interpretation=fs.readFileSync('.github/workflows/regelgeving-bijwerken.yml','utf8');
  assert.match(watcher,/schedule:[\s\S]*?cron:/);
  assert.match(interpretation,/push:[\s\S]*?data\/regulatory-source-state\.json/);
  assert.match(interpretation,/schedule:[\s\S]*?cron:\s*['\"]30 4 \* \* 1['\"]/);
});
