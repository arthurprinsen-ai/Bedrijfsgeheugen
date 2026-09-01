const clean=v=>String(v??'').trim();
const replyError=async(response,code)=>{let detail='';try{detail=JSON.stringify(await response.json())}catch{}const error=new Error(`${code}: ${response.status}${detail?` ${detail}`:''}`);error.code=code;throw error;};

export function createRemoteRecordAdapter({baseUrl,authorization,fetchImpl=fetch}={}){
  const url=clean(baseUrl);
  const auth=clean(authorization);
  if(!url) throw new Error('BRAIN_OPERATING_AUTHORITY_UNCONFIGURED');
  if(!/^Bearer\s+.+/i.test(auth)) throw new Error('BRAIN_OPERATING_AUTHORITY_UNAUTHENTICATED');
  const headers={authorization:auth,accept:'application/json'};
  return Object.freeze({
    async appendRecord(record,{idempotencyKey,sourceRevision=null}={}){
      const response=await fetchImpl(url,{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({record,idempotencyKey,sourceRevision})});
      if(!response.ok) return replyError(response,'BRAIN_OPERATING_AUTHORITY_APPEND_FAILED');
      const body=await response.json();
      if(!body?.record) throw new Error('BRAIN_OPERATING_AUTHORITY_INVALID_APPEND');
      return {duplicate:body.duplicate===true,record:body.record};
    },
    async listRecords(tenantId){
      const endpoint=new URL(url);endpoint.searchParams.set('tenantId',String(tenantId));
      const response=await fetchImpl(endpoint,{method:'GET',headers});
      if(!response.ok) return replyError(response,'BRAIN_OPERATING_AUTHORITY_READ_FAILED');
      const body=await response.json();
      if(!Array.isArray(body?.records)) throw new Error('BRAIN_OPERATING_AUTHORITY_INVALID_READ');
      return body.records;
    }
  });
}
