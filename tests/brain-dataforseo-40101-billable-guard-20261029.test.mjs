import test from 'node:test';
import assert from 'node:assert/strict';
import {isTransientDataforseoStatus,isEmptyDataforseoResult,withOneTransientDataforseoRetry,sourceBatchEvidenceVerdict} from '../supabase/functions/bg-externe-signalen/provider-retry.mjs';
test('billable search engine task 40101 must not be paid/retried twice',async()=>{
 let calls=0;const operation=async()=>{calls++;throw Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{retryable:isTransientDataforseoStatus(200,20000,40101),http_status:200,api_status:20000,task_status:40101});};
 await assert.rejects(withOneTransientDataforseoRetry(operation,{sleep:async()=>{throw Error('UNEXPECTED_DUPLICATE_PAID_RETRY')}}),e=>e.task_status===40101&&e.retryable===false);
 assert.equal(calls,1);
});
test('40101 is not an observed zero and partial batches never turn green',()=>{
 assert.equal(isEmptyDataforseoResult(40101),false);
 assert.equal(isEmptyDataforseoResult(40102),true);
 assert.deepEqual(sourceBatchEvidenceVerdict([{ok:true},{ok:false},{ok:true}]),{green:false,errorClass:'REMOTE'});
});
test('real transient 40103 retains a single bounded retry',async()=>{
 let count=0;const outcome=await withOneTransientDataforseoRetry(async()=>{count++;if(count===1)throw Object.assign(new Error('DATAFORSEO_REMOTE_FAILURE'),{retryable:isTransientDataforseoStatus(200,20000,40103)});return 'observed';},{sleep:async()=>{}});
 assert.equal(count,2);assert.equal(outcome,'observed');
});
