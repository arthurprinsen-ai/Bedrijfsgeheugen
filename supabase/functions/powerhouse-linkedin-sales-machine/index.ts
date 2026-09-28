import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-linkedin-sales-machine-v1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

async function secret(db:any,name:string){
  const env=Deno.env.get(name); if(env)return clean(env);
  const {data}=await db.rpc('bg_geheim',{p_naam:name});
  return clean(data);
}
async function generateComment(apiKey:string,model:string,action:any){
  const evidence=action.evidence||{};
  const response=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({
      model,max_tokens:400,temperature:0.2,
      system:'Je schrijft een inhoudelijke LinkedIn-reactie namens Arthur Prinsen. Reageer uitsluitend op de aangeleverde postcontext. Voeg één concrete observatie, nuance of nuttige vraag toe. Geen verkooptekst, geen Bedrijfsgeheugen-pitch, geen afspraak-CTA, geen overdreven compliment, geen verzonnen feit, geen emoji-spam. Nederlands tenzij de postcontext duidelijk Engelstalig is. Maximaal 450 tekens.',
      messages:[{role:'user',content:JSON.stringify({
        person_name:action.person_name,company_name:action.company_name,role:action.role,
        headline:evidence.headline,summary:evidence.summary,trigger_type:evidence.trigger_type,source_url:action.source_url
      })}]
    }),
    signal:AbortSignal.timeout(30000)
  });
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('COMMENT_AI_'+response.status+':'+clean(body?.error?.message).slice(0,180));
  const text=clean((body?.content||[]).find((x:any)=>x.type==='text')?.text);
  if(!text||text.length>500)throw new Error('COMMENT_AI_OUTPUT_INVALID');
  if(/bedrijfsgeheugen|bel(l)?en|afspraak|demo|scan|offerte/i.test(text))throw new Error('COMMENT_AI_SALES_PITCH_BLOCKED');
  return text;
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=await secret(db,'powerhouse_daily_scheduler_token');
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
  let input:any={}; try{input=await req.json();}catch{}
  const runDate=clean(input?.run_date)||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dryRun=input?.dry_run===true;
  const now=new Date().toISOString();

  try{
    const {data:prep,error:prepError}=await db.rpc('powerhouse_prepare_linkedin_sales_machine_v1',{p_run_date:runDate});
    if(prepError)throw new Error('LINKEDIN_SALES_PREP:'+prepError.message);

    const {data:actions,error:aErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,person_key,company_key,person_name,company_name,role,source_url,evidence,status,priority')
      .eq('action_type','reply_post').eq('channel','linkedin_personal').eq('status','prepared')
      .order('priority',{ascending:false}).limit(3);
    if(aErr)throw new Error('LINKEDIN_COMMENT_READ:'+aErr.message);

    if(dryRun)return json({ok:true,dry_run:true,prepared:prep,comment_candidates:(actions||[]).length,external_side_effects:false});

    const aiKey=await secret(db,'ANTHROPIC_API_KEY');
    if(!aiKey)throw new Error('ANTHROPIC_API_KEY_MISSING');
    const model='claude-sonnet-4-20250514';
    const generated:any[]=[];

    for(const action of actions||[]){
      try{
        const comment=await generateComment(aiKey,model,action);
        const evidence={...(action.evidence||{}),comment_generation:{
          contract:CONTRACT,provider:'Anthropic',model,generated_at:now,
          no_sales_pitch_verified:true,max_chars:500,source_url:action.source_url
        }};
        const {error:uErr}=await db.from('powerhouse_sales_actions')
          .update({message_draft:comment,status:'suggested',evidence,updated_at:now})
          .eq('action_id',action.action_id).eq('status','prepared');
        if(uErr)throw new Error('COMMENT_PREP_WRITE:'+uErr.message);
        generated.push({action_id:action.action_id,status:'suggested'});
      }catch(err:any){
        await db.from('powerhouse_sales_actions').update({
          status:'error',
          evidence:{...(action.evidence||{}),comment_generation:{contract:CONTRACT,failed_at:now,error:clean(err?.message||err).slice(0,300)}},
          updated_at:now
        }).eq('action_id',action.action_id).eq('status','prepared');
        generated.push({action_id:action.action_id,status:'error'});
      }
    }

    let autopilot:any=null;
    if(generated.some(x=>x.status==='suggested')){
      const publisher=await fetch(url+'/functions/v1/powerhouse-social-publisher',{
        method:'POST',
        headers:{'content-type':'application/json','x-powerhouse-token':expected},
        body:JSON.stringify({runDate,mode:'cockpit_autopilot'}),
        signal:AbortSignal.timeout(120000)
      });
      autopilot=await publisher.json().catch(()=>({}));
      if(!publisher.ok)throw new Error('LINKEDIN_AUTOPILOT_'+publisher.status+':'+clean(autopilot?.error).slice(0,200));
    }

    return json({ok:true,contract:CONTRACT,prepared:prep,generated,autopilot,dm_capability:'UNAVAILABLE',dm_fallback:'email'});
  }catch(err:any){
    return json({ok:false,contract:CONTRACT,error:clean(err?.message||err).slice(0,500)},503);
  }
});
