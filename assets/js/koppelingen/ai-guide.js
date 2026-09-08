export async function askConnectorGuide({intent,currentState={},fetchFn=globalThis.fetch}={}){
  const text=String(intent||'').trim();
  if(!text)throw new TypeError('Omschrijf eerst wat je wilt koppelen.');
  const response=await fetchFn('/api/connectors/guide',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({intent:text,currentState})
  });
  let body={};
  try{body=await response.json();}catch{}
  if(!response.ok){
    const error=new Error(body?.error||'AI_GUIDE_UNAVAILABLE');
    error.code=body?.error||'AI_GUIDE_UNAVAILABLE';
    throw error;
  }
  return body;
}
