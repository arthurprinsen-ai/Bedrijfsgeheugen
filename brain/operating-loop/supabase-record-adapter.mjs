function assertClient(client){if(!client?.rpc||!client?.from) throw new TypeError('Supabase record adapter requires rpc/from client');return client;}
const array=v=>Array.isArray(v)?v:[];
const rowToRecord=row=>Object.freeze({
  schemaVersion:'brain-record.v1',tenantId:String(row.tenant_id),type:row.record_type,kind:row.record_kind,id:String(row.record_id),subjectId:String(row.subject_id),
  correlationId:row.correlation_id||null,predecessorIds:array(row.predecessor_ids),owner:row.owner_id||'UNASSIGNED',status:row.status||'OBSERVED',observedAt:row.observed_at,
  executed:row.executed===true,verified:row.verified===true,result:row.result??null,evidenceIds:array(row.evidence_ids),provenance:row.provenance||{},payload:row.payload||{}
});
export function createSupabaseRecordAdapter(client){
  assertClient(client);
  return Object.freeze({
    async appendRecord(record,{idempotencyKey,sourceRevision=null}={}){
      if(!record?.tenantId||!record?.id||!idempotencyKey) throw new TypeError('Supabase append requires record identity and idempotencyKey');
      const {data,error}=await client.rpc('brain_append_record',{
        p_tenant_id:record.tenantId,p_record_id:record.id,p_record_type:record.type,p_record_kind:record.kind,p_subject_id:record.subjectId,
        p_correlation_id:record.correlationId||null,p_predecessor_ids:array(record.predecessorIds),p_owner_id:record.owner||null,p_status:record.status||'OBSERVED',
        p_observed_at:record.observedAt,p_executed:record.executed===true,p_verified:record.verified===true,p_result:record.result??null,p_evidence_ids:array(record.evidenceIds),
        p_provenance:record.provenance||{},p_payload:record.payload||{},p_idempotency_key:String(idempotencyKey),p_source_revision:sourceRevision
      });
      if(error){const e=new Error(`Supabase brain append failed: ${error.message||error.code||'unknown'}`);e.code=error.code||'SUPABASE_BRAIN_APPEND_FAILED';throw e;}
      const row=Array.isArray(data)?data[0]:data;if(!row) throw new Error('Supabase brain append returned no record');return {record:rowToRecord(row)};
    },
    async listRecords(tenantId){
      if(!tenantId) throw new TypeError('Supabase list requires tenantId');
      const {data,error}=await client.from('brain_records').select('*').eq('tenant_id',String(tenantId)).order('observed_at',{ascending:true});
      if(error){const e=new Error(`Supabase brain list failed: ${error.message||error.code||'unknown'}`);e.code=error.code||'SUPABASE_BRAIN_LIST_FAILED';throw e;}
      return array(data).map(rowToRecord);
    }
  });
}
