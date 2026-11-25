import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {CAPABILITIES,buildImprovementEvidenceInventory} from '../scripts/brain/continuous-improvement/improvement-evidence-inventory.mjs';

test('all core improvement surfaces have an evidence inventory',()=>{
  const required=['agent-skills','brain-heartbeat','portal','website','data','engineering','commercial'];
  assert.deepEqual(CAPABILITIES.map(x=>x.id),required);
  const report=buildImprovementEvidenceInventory({now:'2026-10-25T00:00:00.000Z'});
  assert.equal(report.records.length,required.length);
  assert.equal(report.checks.verified_improvements,0);
  assert.equal(report.deployment_status,'NOT_PROVEN');
  assert.ok(report.records.every(x=>x.production_readback===false && x.verified_kpi_delta===null));
});
test('missing paths become actionable gaps, never green evidence',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'powerhouse-gap-'));
  try{
    const report=buildImprovementEvidenceInventory({root,capabilities:[{id:'test',paths:['missing/telemetry'],dimension:'reliability'}]});
    assert.equal(report.records[0].status,'GAP_DETECTED');
    assert.deepEqual(report.records[0].missing_data,['missing/telemetry']);
    assert.equal(report.checks.gaps_found,1);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
