const DEFAULT_ENDPOINT='/api/portal-business-input';

export async function savePortalBusinessInput(input,{fetchFn=globalThis.fetch,endpoint=DEFAULT_ENDPOINT}={}){
  if(typeof fetchFn!=='function')throw new TypeError('fetch is required');
  const response=await fetchFn(endpoint,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json','accept':'application/json'},body:JSON.stringify(input)});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(payload?.message||payload?.error||`Portal input save failed (${response.status})`);
  return payload;
}

export function readLegacyPortalBusinessInputs(storage=globalThis.localStorage){
  if(!storage||typeof storage.length!=='number')return [];
  const inputs=[];
  for(let index=0;index<storage.length;index+=1){
    const key=storage.key(index);
    if(!key||!key.startsWith('bg_portaal_')||['bg_portaal_open','bg_portaal_lead'].includes(key))continue;
    try{
      const answers=JSON.parse(storage.getItem(key)||'null');
      if(!answers||typeof answers!=='object'||Array.isArray(answers))continue;
      inputs.push({inputType:'LegacyPortalState',modelId:key,instanceId:'primary',schemaVersion:1,answers,sourcePortal:'legacy-klantportaal',metadata:{legacyStorageKey:key}});
    }catch{}
  }
  return inputs;
}

export async function migrateLegacyPortalBusinessInputs({storage=globalThis.localStorage,fetchFn=globalThis.fetch,endpoint=DEFAULT_ENDPOINT}={}){
  const inputs=readLegacyPortalBusinessInputs(storage);
  const results=[];
  for(const input of inputs){
    try{results.push({modelId:input.modelId,ok:true,result:await savePortalBusinessInput(input,{fetchFn,endpoint})});}
    catch(error){results.push({modelId:input.modelId,ok:false,error:error instanceof Error?error.message:String(error)});}
  }
  return results;
}
