import { createClient } from 'npm:@supabase/supabase-js@2';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
  status,
  headers:{'content-type':'application/json','cache-control':'no-store'}
});

const SHA=/^[0-9a-f]{40}$/i;
const DEPLOY=/^[0-9a-f]{20,40}$/i;
const PUBLIC_READBACK='https://www.bedrijfsgeheugen.nl/api/completion/release-readiness';

Deno.serve(async(req:Request)=>{
  if(!['GET','POST'].includes(req.method))return json({error:'METHOD_NOT_ALLOWED'},405);

  const url=Deno.env.get('SUPABASE_URL');
  const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({error:'SERVER_CONFIG'},500);

  let response:Response;
  try{
    response=await fetch(PUBLIC_READBACK,{headers:{accept:'application/json','cache-control':'no-cache'},signal:AbortSignal.timeout(8000)});
  }catch(error){
    return json({error:'PRODUCTION_READBACK_UNAVAILABLE',detail:String(error?.message||error).slice(0,240)},503);
  }

  const proof:any=await response.json().catch(()=>null);
  if(!response.ok||!proof?.ready)return json({error:'PRODUCTION_NOT_READY',status:response.status,proof},503);

  const commitRef=String(proof.commit_ref||'').trim();
  const deployId=String(proof.deploy_id||'').trim();
  if(!SHA.test(commitRef)||!DEPLOY.test(deployId)||proof.context!=='production'){
    return json({error:'PRODUCTION_IDENTITY_INVALID',proof},422);
  }

  const observedAt=new Date(String(proof.observed_at||Date.now())).toISOString();
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const rows=[
    {
      source_key:'github-delivery',
      dedupe_key:`github-delivery:${commitRef}`,
      external_event_id:commitRef,
      observed_at:observedAt,
      evidence:{
        contract:'powerhouse-completion-release-readiness-v1',
        commit_ref:commitRef,
        branch:proof.branch||'main',
        exact_production_match:true,
        source:'netlify-production-runtime'
      }
    },
    {
      source_key:'netlify-production',
      dedupe_key:`netlify-production:${deployId}`,
      external_event_id:deployId,
      observed_at:observedAt,
      evidence:{
        contract:'powerhouse-completion-release-readiness-v1',
        deploy_id:deployId,
        commit_ref:commitRef,
        context:'production',
        url:proof.url,
        deploy_url:proof.deploy_url,
        exact_production_match:true
      }
    }
  ];

  const {error}=await client.from('powerhouse_evidence_source_observations').upsert(rows,{onConflict:'dedupe_key',ignoreDuplicates:true});
  if(error)return json({error:'EVIDENCE_WRITE_FAILED',detail:error.message.slice(0,300)},500);

  return json({ok:true,contract:'powerhouse-completion-release-readiness-v1',commit_ref:commitRef,deploy_id:deployId,observed_at:observedAt});
});
