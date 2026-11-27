const codes=new Set(['CAMPAGNE_LOOKUP_MISLUKT','ONGELDIGE_CAMPAGNE_BESTEMMING','SLEUTEL_LOOKUP_MISLUKT','ATTRIBUTIE_MISLUKT']);
const recent=new Map();
export async function recordRedirectIncident(client,code,{now=Date.now(),report=()=>{}}={}){
 if(!codes.has(code))return false;
 const slot=new Date(now).toISOString().slice(0,13);
 const dedupe='bg-l-server-error:'+code+':'+slot;
 if(recent.get(code)===slot)return false;
 recent.set(code,slot);
 try{
  const {error}=await client.from('powerhouse_runtime_events').upsert({
   dedupe_key:dedupe,event_type:'campaign_redirect_server_error',source:'bg-l',subject_key:'campaign-redirect',
   channel:'system',occurred_at:new Date(now).toISOString(),state:'error',data_quality:'OBSERVED',confidence:1,
   evidence:{code,scope:'server_failure',receipt:'write_attempt'},context:{incident_protocol:'agents-skills-register-and-self-fix-v1'},
   updated_at:new Date(now).toISOString()
  },{onConflict:'dedupe_key',ignoreDuplicates:true}).abortSignal(AbortSignal.timeout(1500));
  if(error){report('BG_L_INCIDENT_WRITE_UNVERIFIED');return false}
  return true;
 }catch{report('BG_L_INCIDENT_WRITE_UNVERIFIED');return false}
}
