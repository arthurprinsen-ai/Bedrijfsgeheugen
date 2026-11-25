const FIELDS='record_id,record_type,record_kind,subject_id,owner_id,observed_at,updated_at,source_revision,provenance,payload';
export async function readPortalBusinessInputAuthorityPages(client,tenantId,{pageSize=500,maxRecords=10000}={}){
 if(!client?.from||!String(tenantId||'').trim())throw Error('BUSINESS_INPUT_AUTHORITY_READ_INVALID');
 if(!Number.isInteger(pageSize)||pageSize<1||pageSize>1000||!Number.isInteger(maxRecords)||maxRecords<pageSize)throw Error('BUSINESS_INPUT_HISTORY_CONFIG_INVALID');
 const records=[];
 for(let offset=0;;offset+=pageSize){
  const {data,error}=await client.from('brain_records')
   .select(FIELDS).eq('tenant_id',tenantId).eq('record_type','BusinessInput')
   .order('updated_at',{ascending:true}).order('record_id',{ascending:true})
   .range(offset,offset+pageSize-1);
  if(error||!Array.isArray(data)||data.length>pageSize)throw Error('BUSINESS_INPUT_AUTHORITY_READ_FAILED');
  if(records.length+data.length>maxRecords)throw Error('BUSINESS_INPUT_HISTORY_LIMIT_EXCEEDED');
  records.push(...data);
  if(data.length<pageSize)return records;
 }
}
