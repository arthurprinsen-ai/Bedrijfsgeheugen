import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommercialOutcomeSignalIngestor} from '../brain/learning/commercial-outcome-signal-ingest.mjs';

test('ingest owns no persistence and delegates one canonical RECORD_OUTCOME command',async()=>{
  const writes=[];
  const ingest=createCommercialOutcomeSignalIngestor({
    getProjection:async()=>({revenuePredictions:[{decisionId:'d1',status:'OPEN',prediction:{prediction_id:'p1',decision_id:'d1'}}]}),
    recordOutcome:async command=>{writes.push(command);return {ok:true};},
  });
  await ingest({tenantId:'t1',source:'crm',signalId:'deal-1',type:'order_accepted',decisionId:'d1',predictionId:'p1',confidence:0.99,verified:true,evidenceRefs:['crm:deal-1'],realizedValue:2900});
  assert.equal(writes.length,1);
  assert.equal(writes[0].command,'RECORD_OUTCOME');
  assert.equal(writes[0].order,true);
  assert.equal(writes[0].realizedValue,2900);
});
