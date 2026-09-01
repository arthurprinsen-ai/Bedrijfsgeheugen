const IDENTITY_USER_URL='https://www.bedrijfsgeheugen.nl/.netlify/identity/user';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const arr=(v:unknown)=>Array.isArray(v)?v:[];
const tenantFromUser=(user:any)=>clean(user?.appMetadata?.tenantId||user?.app_metadata?.tenantId)||`user:${clean(user?.id)}`;
const rowToRecord=(row:any)=>({schemaVersion:'brain-record.v1',tenantId:String(row.tenant_id),type:row.record_type,kind:row.record_kind,id:String(row.record_id),subjectId:String(row.subject_id),correlationId:row.correlation_id||null,predecessorIds:arr(row.predecessor_ids),owner:row.owner_id||'UNASSIGNED',status:row.status||'OBSERVED',observedAt:row.observed_at,executed:row.executed===true,verified:row.verified===true,result:row.result??null,evidenceIds:arr(row.evidence_ids),provenance:row.provenance||{},payload:row.payload||{}});
async function identity(authorization:string){const response=await fetch(IDENTITY_USER_URL,{headers:{authorization,accept:'application/json'}});if(!response.ok)return null;try{const user=await response.json();return user?.id?user:null}catch{return null}}
Deno.serve(async(req:Request)=>{
  const authorization=req.headers.get('authorization')||'';
  if(!/^Bearer\s+.+/i.test(authorization)) return json({error:'UNAUTHENTICATED'},401);
  let user:any;try{user=await identity(authorization)}catch{return json({error:'IDENTITY_UNAVAILABLE'},503)}
  if(!user) return json({error:'UNAUTHENTICATED'},401);
  const tenantId=tenantFromUser(user);if(!tenantId||tenantId==='user:') return json({error:'TENANT_UNRESOLVED'},403);
  const suppliedTenant=clean(new URL(req.url).searchParams.get('tenantId'));
  if(suppliedTenant&&suppliedTenant!==tenantId) return json({error:'TENANT_MISMATCH'},403);
  const base=clean(Deno.env.get('SUPABASE_URL')).replace(/\/$/,'');const service=clean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  if(!base||!service) return json({error:'AUTHORITY_STORE_UNCONFIGURED'},503);
  const headers={apikey:service,authorization:`Bearer ${service}`,accept:'application/json','content-type':'application/json'};
  if(req.method==='GET'){
    const endpoint=`${base}/rest/v1/brain_records?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=observed_at.asc`;
    const read=await fetch(endpoint,{headers});if(!read.ok)return json({error:'AUTHORITY_READ_FAILED',status:read.status},502);
    const rows=await read.json();return json({authority:'supabase:brain_records',tenantId,records:arr(rows).map(rowToRecord)},200);
  }
  if(req.method==='POST'){
    let body:any;try{body=await req.json()}catch{return json({error:'INVALID_JSON'},400)}
    const record=body?.record;if(!record?.id||!record?.type||!record?.kind||!record?.subjectId||!body?.idempotencyKey)return json({error:'INVALID_RECORD'},400);
    if(clean(record.tenantId)!==tenantId)return json({error:'TENANT_MISMATCH'},403);
    const payload={p_tenant_id:tenantId,p_record_id:String(record.id),p_record_type:String(record.type),p_record_kind:String(record.kind),p_subject_id:String(record.subjectId),p_correlation_id:record.correlationId||null,p_predecessor_ids:arr(record.predecessorIds),p_owner_id:record.owner||null,p_status:record.status||'OBSERVED',p_observed_at:record.observedAt,p_executed:record.executed===true,p_verified:record.verified===true,p_result:record.result??null,p_evidence_ids:arr(record.evidenceIds),p_provenance:record.provenance||{},p_payload:record.payload||{},p_idempotency_key:String(body.idempotencyKey),p_source_revision:body.sourceRevision||null};
    const write=await fetch(`${base}/rest/v1/rpc/brain_append_record`,{method:'POST',headers:{...headers,prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!write.ok){const detail=await write.text();return json({error:'AUTHORITY_APPEND_FAILED',status:write.status,detail:detail.slice(0,500)},write.status===409?409:502)}
    const data=await write.json();const row=Array.isArray(data)?data[0]:data;if(!row)return json({error:'AUTHORITY_APPEND_EMPTY'},502);
    return json({authority:'supabase:brain_records',record:rowToRecord(row)},201);
  }
  return new Response('Method Not Allowed',{status:405,headers:{allow:'GET, POST'}});
});
