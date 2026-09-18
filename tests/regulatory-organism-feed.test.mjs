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
