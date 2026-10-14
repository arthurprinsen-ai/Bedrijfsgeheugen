// Netlify runs this scheduler OUTSIDE PostgreSQL pg_cron. It stores outage
// observations in Netlify Blobs before database retry; it never performs provider
// sends, DB schema writes, or claims a recovery succeeded without readback.
import { getStore } from '@netlify/blobs';

export const config = { schedule: '*/5 * * * *' };

const base=process.env.SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const timeoutMs=6000;

export default async function handler(){
  // Preview deploys must never write into production's site-scoped outage store.
  if(process.env.CONTEXT!=='production')return new Response(null,{status:204});
  const observedAt=new Date().toISOString();
  const bucket=observedAt.slice(0,16).replace(/[-:T]/g,'');
  const store=getStore({name:'powerhouse-external-database-watch-v1',consistency:'strong',region:'eu-central-1'});
  const key='failures/'+bucket;
  const headers={'apikey':serviceKey||'',Authorization:'Bearer '+(serviceKey||'')};
  let status=null,ok=false,error=null;
  if(!base||!serviceKey){
    error='MISSING_SUPABASE_WATCH_CREDENTIALS';
  }else{
    try{
      const url=new URL('/rest/v1/powerhouse_runtime_events',base);
      url.searchParams.set('select','event_id');
      url.searchParams.set('limit','1');
      const res=await fetch(url,{headers,signal:AbortSignal.timeout(timeoutMs)});
      status=res.status;
      ok=res.ok;
      if(!ok)error='SUPABASE_REST_STATUS_'+res.status;
      await res.body?.cancel();
    }catch(e){error=e?.name==='TimeoutError'?'SUPABASE_TIMEOUT':'SUPABASE_REST_UNREACHABLE';}
  }
  // Read the current status directly: listing all historical outage blobs would
  // repeatedly declare "recovery" on every healthy run after a single outage.
  const previous=await store.get('state/latest',{type:'json',consistency:'strong'});
  const state=(!base||!serviceKey)?'CONFIGURATION_ERROR':ok?'REST_READBACK_OK':'OUTAGE_OBSERVED';
  if(state==='OUTAGE_OBSERVED'){
    await store.setJSON(key,{contract:'external-database-watch-v1',status:state,
      observed_at:observedAt,http_status:status,error});
  }
  if(ok&&previous?.state==='OUTAGE_OBSERVED'){
    await store.setJSON('recoveries/'+bucket,{
      contract:'external-database-watch-v1',status:'REST_READBACK_RECOVERED',
      observed_at:observedAt,last_outage_key:previous.last_outage_key,
      db_cron_execution_proven:false
    });
  }
  await store.setJSON('state/latest',{
    contract:'external-database-watch-v1',state,observed_at:observedAt,
    last_outage_key:state==='OUTAGE_OBSERVED'?key:previous?.last_outage_key??null,
    http_status:status,error
  });
  console.log(JSON.stringify({contract:'external-database-watch-v1',state,
    observed_at:observedAt,http_status:status,error,transition_from:previous?.state??null,
    database_scheduler_reconciled:false,provider_delivery_verified:false}));
  return new Response(null,{status:204});
}
