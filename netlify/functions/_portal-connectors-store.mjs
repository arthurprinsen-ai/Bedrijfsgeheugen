const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''))?String(value):null;

export function createPortalConnectorsStore({fetchFn=globalThis.fetch,baseUrl=process.env.SUPABASE_URL||process.env.BG_PORTAL_EU_SUPABASE_URL,serviceToken=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.BG_PORTAL_EU_SERVICE_TOKEN}={}){
  if(!fetchFn||!baseUrl||!serviceToken)return Object.freeze({configured:false});
  const root=String(baseUrl).replace(/\/$/,'').replace(/\/functions\/v1$/,'');
  const headers={apikey:serviceToken,authorization:`Bearer ${serviceToken}`,'content-type':'application/json',prefer:'return=representation'};
  async function call(path,options={}){const r=await fetchFn(`${root}/rest/v1/${path}`,{headers,...options});if(!r.ok)throw new Error(`Connector store failed (${r.status})`);return r.status===204?null:r.json().catch(()=>null);}
  const rowToDraft=row=>row?{...(row.configuratie||{}),id:row.id,name:row.naam,templateId:row.template_id,state:row.status,version:row.versie,tenantId:row.organisatie_id}:null;
  return Object.freeze({
    configured:true,
    async list(tenantId){const t=uuid(tenantId);if(!t)return[];const rows=await call(`connector_definitions?organisatie_id=eq.${t}&select=*&order=bijgewerkt_op.desc`);return (rows||[]).map(rowToDraft);},
    async get(tenantId,id){const t=uuid(tenantId),cid=uuid(id);if(!t||!cid)return null;const rows=await call(`connector_definitions?organisatie_id=eq.${t}&id=eq.${cid}&select=*&limit=1`);return rowToDraft(rows?.[0]);},
    async saveDraft(tenantId,draft){const t=uuid(tenantId);if(!t)throw new Error('INVALID_TENANT');const cid=uuid(draft.id);const body={organisatie_id:t,naam:String(draft.name||'Nieuwe koppeling'),template_id:draft.templateId||null,status:draft.state||'Draft',versie:Number(draft.version)||1,configuratie:{...draft,id:undefined,tenantId:undefined}};let rows;if(cid){rows=await call(`connector_definitions?organisatie_id=eq.${t}&id=eq.${cid}`,{method:'PATCH',body:JSON.stringify({...body,bijgewerkt_op:new Date().toISOString()})});}else{rows=await call('connector_definitions',{method:'POST',body:JSON.stringify(body)});}return rowToDraft(rows?.[0]);},
    async saveExecution(tenantId,execution){const t=uuid(tenantId),cid=uuid(execution.connectorId);if(!t||!cid)throw new Error('INVALID_EXECUTION_SCOPE');const rows=await call('connector_executions',{method:'POST',body:JSON.stringify({organisatie_id:t,connector_id:cid,connector_versie:execution.connectorVersion||1,dedupe_key:execution.dedupeKey||null,status:execution.status,evidence:execution.evidence||{},fout:execution.error||null,afgerond_op:execution.completedAt||null})});return rows?.[0]||null;},
    async listExecutions(tenantId,connectorId){const t=uuid(tenantId),cid=uuid(connectorId);if(!t||!cid)return[];return await call(`connector_executions?organisatie_id=eq.${t}&connector_id=eq.${cid}&select=*&order=gestart_op.desc&limit=100`)||[];},
    async saveReview(tenantId,review){const t=uuid(tenantId),cid=uuid(review.connectorId);if(!t||!cid)throw new Error('INVALID_REVIEW_SCOPE');const rows=await call('connector_reviews',{method:'POST',body:JSON.stringify({organisatie_id:t,connector_id:cid,execution_id:uuid(review.executionId),status:review.status||'pending',payload:review.payload||{}})});return rows?.[0]||null;},
    async listReviewQueue(tenantId){const t=uuid(tenantId);if(!t)return[];return await call(`connector_reviews?organisatie_id=eq.${t}&status=eq.pending&select=*&order=aangemaakt_op.asc`)||[];}
  });
}
