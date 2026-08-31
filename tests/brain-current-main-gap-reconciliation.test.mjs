import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ledgerPath='brain/evidence/current-main-gap-reconciliation-2026-08-31.json';
const requiredIds=[
  'canonical-business-graph','change-impact-engine','external-intelligence-closed-loop','decision-engine-30-90-180','action-execution-store','verified-value-evidence','living-memory','ai-governance-registry','universal-app-delivery-adapters','integration-observability','legacy-calculation-parity','production-performance-rum','executive-cockpit-projection','completion-gate','chat-learning-brain-writeback'
];
const allowed=new Set(['PROVEN','BUILT_NOT_PROVEN','PARTIAL','BLOCKED','MISSING']);

test('current-main reconciliation covers every material historical gap exactly once',()=>{
  assert.equal(fs.existsSync(ledgerPath),true,'reconciliation ledger must exist');
  const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
  assert.equal(ledger.version,'CURRENT-MAIN-GAP-RECONCILIATION-v1');
  assert.equal(ledger.canonicalArchitecture,'BRAIN-DELIVERY-v2');
  assert.equal(ledger.sourceSnapshot,'Bedrijfsgeheugen_implementatiestatus_2026-08-30(3).md');
  const items=ledger.items ?? [];
  assert.equal(new Set(items.map(x=>x.id)).size,items.length,'gap ids must be unique');
  for(const id of requiredIds){
    const matches=items.filter(x=>x.id===id);
    assert.equal(matches.length,1,`missing or duplicate ${id}`);
    const item=matches[0];
    assert.equal(allowed.has(item.status),true,`invalid status for ${id}`);
    assert.ok(Array.isArray(item.evidenceRefs) && item.evidenceRefs.length>0,`${id} needs evidence refs`);
    assert.ok(typeof item.owner==='string' && item.owner.length>0,`${id} needs owner`);
    if(item.status!=='PROVEN') assert.ok(typeof item.nextAction==='string' && item.nextAction.length>0,`${id} needs next action`);
  }
});

test('reconciliation forbids unsupported all-green claims',()=>{
  const ledger=JSON.parse(fs.readFileSync(ledgerPath,'utf8'));
  for(const item of ledger.items ?? []){
    if(item.status==='PROVEN') assert.ok(item.productionEvidence===true || item.scope==='repository-contract',`${item.id} cannot be PROVEN from implementation claim alone`);
  }
});
