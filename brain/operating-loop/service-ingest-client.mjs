const requireText=(value,name)=>{
  if(typeof value!=='string'||!value.trim()) throw new TypeError(`${name} is required`);
  return value.trim();
};

const parseJsonSafely=async response=>{
  try{return await response.json();}catch{return {};}
};

export function createBrainServiceIngestClient({endpoint,token,fetchImpl=globalThis.fetch}={}){
  const url=requireText(endpoint,'endpoint');
  const bearer=requireText(token,'token');
  if(typeof fetchImpl!=='function') throw new TypeError('fetch implementation is required');

  return Object.freeze({
    async post(record,{idempotencyKey}={}){
      const key=requireText(idempotencyKey,'idempotencyKey');
      if(!record||typeof record!=='object'||Array.isArray(record)) throw new TypeError('record is required');
      const response=await fetchImpl(url,{
        method:'POST',
        headers:{
          'content-type':'application/json',
          authorization:`Bearer ${bearer}`
        },
        body:JSON.stringify({...record,idempotencyKey:key})
      });
      const payload=await parseJsonSafely(response);
      if(!response?.ok){
        const error=new Error(`BRAIN service ingest failed with status ${response?.status??'unknown'}`);
        error.code='BRAIN_INGEST_FAILED';
        error.status=response?.status??null;
        error.serverError=typeof payload?.error==='string'?payload.error:null;
        throw error;
      }
      return payload;
    }
  });
}
