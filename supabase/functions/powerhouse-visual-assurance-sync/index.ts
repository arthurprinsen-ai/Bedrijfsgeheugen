import { createClient } from 'npm:@supabase/supabase-js@2';

const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=(v:unknown)=>String(v??'').trim();
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const WORKFLOW='portal-visual-density.yml';
const LOOP_KEY='portal-visual-density';
const FINGERPRINT='portal-visual-density-oversized-responsive-cascade-v1';
const STAGES=['input','decision','action','readback','outcome','measurement','learning','guard'] as const;
const ghHeaders={'accept':'application/vnd.github+json','user-agent':'bedrijfsgeheugen-powerhouse-visual-assurance-sync'};

async function gh(path:string){
  const r=await fetch('https://api.github.com'+path,{headers:ghHeaders});
  const body=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error('GITHUB_HTTP_'+r.status);
  return body;
}

Deno.serve(async(req)=>{
  if(req.method!=='POST') return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'';
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service) return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=clean((await db.rpc('bg_geheim',{p_naam:'powerhouse_daily_scheduler_token'})).data);
  if(!expected||req.headers.get('x-powerhouse-token')!==expected) return json({ok:false,error:'UNAUTHORIZED'},401);

  try{
    const runs=await gh('/repos/'+REPO+'/actions/workflows/'+WORKFLOW+'/runs?branch=main&status=completed&per_page=20');
    const successful=(runs?.workflow_runs||[]).filter((r:any)=>r?.conclusion==='success'&&r?.head_branch==='main');
    const run=successful[0];
    if(!run) return json({ok:true,synced:false,reason:'NO_SUCCESSFUL_MAIN_RUN'});

    const jobs=await gh('/repos/'+REPO+'/actions/runs/'+run.id+'/jobs?per_page=100');
    const job=(jobs?.jobs||[]).find((j:any)=>j?.name==='visual-density');
    if(!job||job?.conclusion!=='success') return json({ok:true,synced:false,reason:'VISUAL_DENSITY_JOB_NOT_GREEN',run_id:run.id});

    const observedAt=clean(job.completed_at)||clean(run.updated_at)||clean(run.run_started_at)||new Date().toISOString();
    const common={
      github_run_id:run.id,
      github_run_attempt:run.run_attempt,
      github_run_url:run.html_url,
      github_job_id:job.id,
      github_job_url:job.html_url,
      head_sha:run.head_sha,
      event:run.event,
      conclusion:'success',
      workflow:WORKFLOW,
      synced_by:'powerhouse-visual-assurance-sync-v1'
    };
    const stageEvidence:Record<string,unknown>={
      input:{...common,routes:3,viewports:3,screenshots_expected:9},
      decision:{...common,contract:'config/powerhouse-portal-visual-assurance-v1.json',fail_closed:true},
      action:{...common,runner:'GitHub Actions + Playwright Chromium'},
      readback:{...common,provider:'github-actions',job_conclusion:'success'},
      outcome:{...common,status:'PASS',screenshots_total:9},
      measurement:{...common,threshold_contract:'config/powerhouse-portal-visual-assurance-v1.json'},
      learning:{...common,fingerprint:FINGERPRINT},
      guard:{...common,pass:true,regression_guard_ref:'.github/workflows/portal-visual-density.yml'}
    };

    for(const stage of STAGES){
      const {error}=await db.from('powerhouse_loop_assurance_receipts_v1').upsert({
        loop_key:LOOP_KEY,stage,observed_at:observedAt,evidence:stageEvidence[stage],updated_at:new Date().toISOString()
      },{onConflict:'loop_key,stage'});
      if(error) throw new Error('RECEIPT_'+stage.toUpperCase()+'_FAILED');
    }

    const {data:registry,error:registryReadError}=await db.from('powerhouse_loop_assurance_registry_v1')
      .select('evidence_contract').eq('loop_key',LOOP_KEY).maybeSingle();
    if(registryReadError) throw new Error('REGISTRY_READ_FAILED');
    const evidenceContract={
      ...(registry?.evidence_contract||{}),
      github_last_success:{
        run_id:run.id,job_id:job.id,head_sha:run.head_sha,observed_at:observedAt,run_url:run.html_url
      },
      sync_adapter:'powerhouse-visual-assurance-sync-v1'
    };
    const {error:registryError}=await db.from('powerhouse_loop_assurance_registry_v1')
      .update({evidence_contract:evidenceContract,updated_at:new Date().toISOString()}).eq('loop_key',LOOP_KEY);
    if(registryError) throw new Error('REGISTRY_UPDATE_FAILED');

    const {data:q,error:qReadError}=await db.from('powerhouse_quality_events')
      .select('performance_evidence').eq('fingerprint',FINGERPRINT).maybeSingle();
    if(qReadError) throw new Error('QUALITY_READ_FAILED');
    const performance={...(q?.performance_evidence||{}),production_pass:true,screenshots:9,github_run_id:run.id,github_job_id:job.id,head_sha:run.head_sha,observed_at:observedAt};
    const {error:qError}=await db.from('powerhouse_quality_events')
      .update({performance_evidence:performance,status:'verified',updated_at:new Date().toISOString()}).eq('fingerprint',FINGERPRINT);
    if(qError) throw new Error('QUALITY_UPDATE_FAILED');

    const refreshed=await db.rpc('powerhouse_refresh_loop_assurance_v1',{p_now:new Date().toISOString()});
    if(refreshed.error) throw new Error('ASSURANCE_REFRESH_FAILED');
    const state=(refreshed.data||[]).find((x:any)=>x?.out_loop_key===LOOP_KEY)||null;

    return json({ok:true,synced:true,run_id:run.id,job_id:job.id,head_sha:run.head_sha,observed_at:observedAt,state});
  }catch(error){
    return json({ok:false,error:error instanceof Error?error.message:'SYNC_FAILED'},500);
  }
});
