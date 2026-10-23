const jsonRequest=async(url,{method='GET',body,fetchFn=globalThis.fetch,authHeaders=null}={})=>{
  const identity=typeof authHeaders==='function'?await authHeaders():{};
  if(authHeaders&&(typeof identity?.authorization!=='string'||!/^Bearer\s+\S+$/i.test(identity.authorization))){
    const error=new Error('AUTH_TOKEN_UNAVAILABLE');error.code='AUTH_TOKEN_UNAVAILABLE';throw error;
  }
  const headers={...(identity||{}),...(body===undefined?{}:{'content-type':'application/json'})};
  const response=await fetchFn(url,{method,credentials:'same-origin',headers,body:body===undefined?undefined:JSON.stringify(body)});
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

export const createConnectorApi=({fetchFn=globalThis.fetch,authHeaders=null}={})=>Object.freeze({
  getReadiness:()=>jsonRequest('/api/connectors/readiness',{fetchFn,authHeaders}),
  list:()=>jsonRequest('/api/connectors',{fetchFn,authHeaders}),
  get:id=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}`,{fetchFn,authHeaders}),
  createDraft:definition=>jsonRequest('/api/connectors',{method:'POST',body:{...definition,state:'Draft'},fetchFn,authHeaders}),
  saveDraft:(id,definition)=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/draft`,{method:'PUT',body:{...definition,state:'Draft'},fetchFn,authHeaders}),
  safeTest:(id,sample)=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/test`,{method:'POST',body:{sample},fetchFn,authHeaders}),
  activate:(id,testExecutionId)=>{
    if(!testExecutionId){
      const error=new Error('TEST_EVIDENCE_REQUIRED');
      error.code='TEST_EVIDENCE_REQUIRED';
      throw error;
    }
    return jsonRequest(`/api/connectors/${encodeURIComponent(id)}/activate`,{method:'POST',body:{testExecutionId},fetchFn,authHeaders});
  },
  pause:(id,reason)=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/pause`,{method:'POST',body:{reason},fetchFn,authHeaders}),
  executions:id=>jsonRequest(`/api/connectors/${encodeURIComponent(id)}/executions`,{fetchFn,authHeaders})
});
