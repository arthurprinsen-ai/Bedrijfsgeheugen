import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseRecordAdapter } from '../brain/operating-loop/supabase-record-adapter.mjs';
import { createOperatingLoopStore } from '../brain/operating-loop/store.mjs';

function fakeClient(){
  const rows=[]; const calls=[];
  return {
    rows,calls,
    async rpc(name,args){
      calls.push({kind:'rpc',name,args});
      assert.equal(name,'brain_append_record');
      const existing=rows.find(r=>r.tenant_id===args.p_tenant_id&&(r.record_id===args.p_record_id||r.idempotency_key===args.p_idempotency_key));
      if(existing) return {data:existing,error:null};
      const row={tenant_id:args.p_tenant_id,record_id:args.p_record_id,record_type:args.p_record_type,record_kind:args.p_record_kind,subject_id:args.p_subject_id,correlation_id:args.p_correlation_id,predecessor_ids:args.p_predecessor_ids,owner_id:args.p_owner_id,status:args.p_status,observed_at:args.p_observed_at,executed:args.p_executed,verified:args.p_verified,result:args.p_result,evidence_ids:args.p_evidence_ids,provenance:args.p_provenance,payload:args.p_payload,idempotency_key:args.p_idempotency_key,source_revision:args.p_source_revision};
      rows.push(row); return {data:row,error:null};
    },
    from(table){
      assert.equal(table,'brain_records');
      return {
        select(){
          return {
            eq(column,value){
              return {
                order(){
                  calls.push({kind:'list',column,value});
                  return Promise.resolve({data:rows.filter(r=>r[column]===value),error:null});
                }
              };
            }
          };
        }
      };
    }
  };
}

test('Supabase adapter appends canonical records via RPC and reads tenant records', async()=>{
  const client=fakeClient(); const adapter=createSupabaseRecordAdapter(client);
  const record={schemaVersion:'brain-record.v1',tenantId:'T1',type:'Evidence',kind:'evidence',id:'E1',subjectId:'subject:1',correlationId:'C1',predecessorIds:[],owner:'sensor',status:'OBSERVED',observedAt:'2026-08-31T07:30:00Z',executed:false,verified:false,result:null,evidenceIds:[],provenance:{source:'test',sourceId:'source:1'},payload:{x:1}};
  const first=await adapter.appendRecord(record,{idempotencyKey:'idem:E1',sourceRevision:'r1'});
  const second=await adapter.appendRecord(record,{idempotencyKey:'idem:E1',sourceRevision:'r1'});
  assert.equal(first.record.id,'E1'); assert.equal(second.record.id,'E1');
  const listed=await adapter.listRecords('T1'); assert.equal(listed.length,1); assert.equal(listed[0].correlationId,'C1');
});

test('Operating loop store accepts persistent record-adapter interface', async()=>{
  const client=fakeClient(); const adapter=createSupabaseRecordAdapter(client); const store=createOperatingLoopStore(adapter,{now:()=> '2026-08-31T07:31:00Z'});
  const appended=await store.append({tenantId:'T1',type:'Evidence',id:'E1',subjectId:'subject:1',owner:'sensor',source:'test',sourceId:'source:1',correlationId:'C1',predecessorIds:[],evidenceIds:[],payload:{},idempotencyKey:'idem:E1'});
  assert.equal(appended.record.id,'E1');
  const projection=await store.getProjection('T1'); assert.equal(projection.records.length,1); assert.equal(projection.loopSummary.total,1); assert.equal(projection.loopSummary.complete,0);
});
