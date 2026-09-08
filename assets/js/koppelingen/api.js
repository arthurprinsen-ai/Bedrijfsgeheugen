const jsonRequest=async(url,{method='GET',body,fetchFn=globalThis.fetch}={})=>{
  const response=await fetchFn(url,{method,headers:body===undefined?undefined:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  let payload=null;
  try{payload=await response.json();}catch{}
  if(!response.ok){
    const error=new Error(payload?.message||payload?.error||`HTTP_${response.status}`);
    error.code=payload?.error||`HTTP_${response.status}`;
    error.status=response.status;
    error.details=payload;
    throw error;
  }
  return payload;
};

export const createConnectorApi=({fetchFn=globalThis.fetch}={})=>Object.freeze({
  getReadiness:()=>jsonRequest('/api/connectors/readiness',{fetchFn}),
  list:()=>jsonRequest('/api/connectors',{fetchFn}),
  get:id=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}`,{fetchFn}),
  createDraft:definition=>jsonRequest('/api/connectors',{method:'POST',body:{...definition,state:'Draft'},fetchFn}),
  saveDraft:(id,definition)=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/draft`,{method:'PUT',body:{...definition,state:'Draft'},fetchFn}),
  safeTest:(id,sample)=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/test`,{method:'POST',body:{sample},fetchFn}),
  activate:(id,testExecutionId)=>{
    if(!testExecutionId){
      const error=new Error('TEST_EVIDENCE_REQUIRED');
      error.code='TEST_EVIDENCE_REQUIRED';
      throw error;
    }
    return jsonRequest(`/api/connectors/${encodeURIComponent(id)}/activate`,{method:'POST',body:{testExecutionId},fetchFn});
  },
  pause:(id,reason)=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/pause`,{method:'POST',body:{reason},fetchFn}),
  executions:id=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/executions`,{fetchFn})
});
