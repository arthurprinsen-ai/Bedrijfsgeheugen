import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-human-sales-composer-v1';
const clean=(v:any)=>String(v??'').trim();
const J=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const safe=(x:any)=>{try{return JSON.parse(JSON.stringify(x))}catch{return{unserializable:true}}};
async function secret(db:any,n:string){const e=Deno.env.get(n);if(e)return clean(e);const{data}=await db.rpc('bg_geheim',{p_naam:n});return clean(data)}
function words(s:string){return clean(s).split(/\s+/).filter(Boolean).length}
function hashLite(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16)}
function extractJson(s:string){const t=clean(s).replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();try{return JSON.parse(t)}catch{};const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1))}catch{}}throw new Error('AI_JSON_INVALID')}
function deepGeneratedText(v:any):string{
 if(typeof v==='string'){const t=clean(v);if(t.startsWith('{')||t.startsWith('[')||t.includes('"body"'))return t;return''}
 if(Array.isArray(v)){for(const x of v){const t=deepGeneratedText(x);if(t)return t}return''}
 if(v&&typeof v==='object'){
   for(const k of ['content','text','output_text','response','result','message']){if(k in v){const t=deepGeneratedText(v[k]);if(t)return t}}
   for(const k of ['choices','data','items','output']){if(k in v){const t=deepGeneratedText(v[k]);if(t)return t}}
 }
 return''
}
function contextIsSpecific(action:any,plan:any){
 const e=action?.evidence||{};
 const observed=e?.predictive_brief?.observed_fact||{};
 const pred=e?.predictive_brief?.prediction||{};
 const hasTrigger=!!clean(e?.trigger_key||e?.trigger_type||observed?.trigger_type||pred?.buying_trigger);
 const hasPost=!!clean(e?.headline||e?.summary||e?.source_url);
 const rel=e?.relationship_evidence||{};
 const hasRelationship=!!clean(rel?.connected_on)&&!!clean(action?.company_name);
 const hasReply=!!clean(e?.reply_text||e?.inbound_message||e?.last_message);
 return hasTrigger||hasPost||hasReply||(plan?.play_key==='value_first'&&hasRelationship);
}
function deterministicChecks(body:string,subject:string,plan:any,action:any){
 const max=Number(plan?.max_words||100),wc=words(body),qs=(body.match(/\?/g)||[]).length;
 const text=body.toLowerCase();
 const prohibited=[
   ['generic_connected',/we zijn al een tijd verbonden|we zijn al een tijdje verbonden/],
   ['generic_profile',/ik zag je profiel|i saw your profile/],
   ['reply_guilt',/nog niets gehoord|didn.?t hear back|geen reactie gehad/],
   ['fake_urgency',/laatste kans|alleen vandaag|nu beslissen/],
   ['corporate_jargon',/in het huidige digitale landschap|synergie|ontzorgen/]
 ];
 const bad=prohibited.filter(([,r]:any)=>r.test(text)).map(([k]:any)=>k);
 const cta=clean(plan?.cta_style);
 const qok=cta==='no_question'?qs===0:qs<=1;
 const contextOk=contextIsSpecific(action,plan);
 const nameOrCompany=clean(action?.person_name)||clean(action?.company_name);
 const personalOk=!nameOrCompany || text.includes(clean(action.person_name).toLowerCase().split(' ')[0]) || text.includes(clean(action.company_name).toLowerCase());
 const subjectOk=action?.channel?.toLowerCase().includes('email') ? (words(subject)>=2&&words(subject)<=7) : true;
 const pass=wc>0&&wc<=max&&qok&&bad.length===0&&contextOk&&personalOk&&subjectOk;
 const score=[wc>0&&wc<=max,qok,bad.length===0,contextOk,personalOk,subjectOk].filter(Boolean).length/6;
 return {pass,score,checks:{word_count:wc,max_words:max,question_count:qs,question_rule_ok:qok,prohibited_hits:bad,context_specific:contextOk,personalized:personalOk,subject_ok:subjectOk}};
}
async function generateAnthropic(key:string,model:string,action:any,plan:any){
 const language=/\.uk$|\b(ltd|limited)\b/i.test(clean(action?.company_name))?'English':'Dutch';
 const system=`You write one-to-one B2B outreach on behalf of Arthur Prinsen / Bedrijfsgeheugen. The message must feel written by a thoughtful human, never like automation. Use only supplied evidence. Never invent facts, urgency, metrics, pain, relationship history, or personal details. Facts and hypotheses must remain distinct. Goal: the smallest logical commitment, not a meeting. Use the selected sales play and psychology ethically: reduce friction, create relevance and curiosity, never manipulate. One primary problem, at most one question/CTA. No generic compliment, no service catalogue, no AI hype, no guilt about non-response. Light situational humor is allowed only if it naturally follows from evidence and never at the prospect's expense. Output strict JSON: {"subject":"","body":"","why_this_works":"","quality_rationale":""}. Language: ${language}.`;
 const payload={person_name:action.person_name,company_name:action.company_name,role:action.role,channel:action.channel,action_type:action.action_type,play:plan,evidence:action.evidence,reason:action.reason,source_url:action.source_url};
 const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model,max_tokens:700,temperature:0.35,system,messages:[{role:'user',content:JSON.stringify(payload)}]}),signal:AbortSignal.timeout(35000)});
 const x:any=await r.json().catch(()=>({}));if(!r.ok)throw new Error('AI_'+r.status+':'+clean(x?.error?.message).slice(0,240));
 const txt=clean((x?.content||[]).find((z:any)=>z.type==='text')?.text);return extractJson(txt);
}
async function generateGroq(db:any,model:string,action:any,plan:any){
 const key=await secret(db,'COMPOSIO_API_KEY');if(!key)throw new Error('COMPOSIO_API_KEY_MISSING');
 const language=/\.uk$|\b(ltd|limited)\b/i.test(clean(action?.company_name))?'English':'Dutch';
 const system=`You write one-to-one B2B outreach on behalf of Arthur Prinsen / Bedrijfsgeheugen. The message must feel written by a thoughtful human, never like automation. Use only supplied evidence. Never invent facts, urgency, metrics, pain, relationship history, or personal details. Facts and hypotheses must remain distinct. Goal: the smallest logical commitment, not a meeting. Use the selected sales play and psychology ethically: reduce friction, create relevance and curiosity, never manipulate. One primary problem, at most one question/CTA. No generic compliment, no service catalogue, no AI hype, no guilt about non-response. Light situational humor is allowed only if it naturally follows from evidence and never at the prospect's expense. Return ONLY valid JSON with exactly: subject, body, why_this_works, quality_rationale. Language: ${language}.`;
 const payload={person_name:action.person_name,company_name:action.company_name,role:action.role,channel:action.channel,action_type:action.action_type,play:plan,evidence:action.evidence,reason:action.reason,source_url:action.source_url};
 const rr=await fetch('https://backend.composio.dev/api/v3.1/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT',{method:'POST',headers:{'content-type':'application/json','x-api-key':key},body:JSON.stringify({version:'latest',arguments:{model,temperature:0.25,max_tokens:1800,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}]}}),signal:AbortSignal.timeout(45000)});
 const x:any=await rr.json().catch(()=>({}));if(!rr.ok||x?.successful!==true)throw new Error('GROQ_'+rr.status+':'+clean(x?.error||x?.message||x?.data?.message).slice(0,240));
 const raw=clean(x?.data?.choices?.[0]?.message?.content)||deepGeneratedText(x?.data)||deepGeneratedText(x);if(!raw)throw new Error('GROQ_EMPTY');return extractJson(raw);
}
Deno.serve(async(req)=>{
 if(req.method!=='POST')return J({ok:false,error:'POST_ONLY'},405);
 const url=Deno.env.get('SUPABASE_URL')||'',role=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!role)return J({ok:false,error:'CONFIG'},500);
 const db=createClient(url,role,{auth:{persistSession:false,autoRefreshToken:false}}),token=await secret(db,'powerhouse_daily_scheduler_token');
 if(!token||req.headers.get('x-powerhouse-token')!==token)return J({ok:false,error:'UNAUTHORIZED'},401);
 let input:any={};try{input=await req.json()}catch{}
 const actionId=clean(input?.action_id);if(!actionId)return J({ok:false,error:'ACTION_ID_REQUIRED'},400);
 const now=new Date().toISOString();
 try{
   await db.rpc('powerhouse_apply_message_plan_v1',{p_action_id:actionId});
   const [{data:action,error:aErr},{data:plan,error:pErr}]=await Promise.all([
     db.from('powerhouse_sales_actions').select('action_id,person_key,company_key,person_name,company_name,role,action_type,channel,priority,reason,evidence,message_draft,source_url,status').eq('action_id',actionId).maybeSingle(),
     db.from('powerhouse_commercial_message_plan_v1').select('*').eq('action_id',actionId).maybeSingle()
   ]);
   if(aErr||!action)throw new Error('ACTION_NOT_FOUND');
   if(pErr||!plan)throw new Error('MESSAGE_PLAN_NOT_AVAILABLE');
   if(!contextIsSpecific(action,plan)){
     const ev={...(action.evidence||{}),commercial_copy:{contract:CONTRACT,state:'DATA_AANVULLEN',reason:'UNIQUE_CONTEXT_REQUIRED',evaluated_at:now}};
     await db.from('powerhouse_sales_actions').update({evidence:ev,updated_at:now}).eq('action_id',actionId);
     return J({ok:true,composed:false,state:'DATA_AANVULLEN',reason:'UNIQUE_CONTEXT_REQUIRED',play_key:plan.play_key});
   }
   const {data:gov}=await db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle();
   const {data:fallbackGov}=await db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-composio-content-fallback-v1').maybeSingle();
   if(!gov||gov.approved!==true||gov.lifecycle_status!=='ACTIVE'||gov.provider!=='Anthropic')throw new Error('AI_GOVERNANCE_UNAVAILABLE');
   const planPayload={play_key:plan.play_key,play_name:plan.play_name,objective:plan.objective,psychology:plan.psychology,message_structure:plan.message_structure,cta_style:plan.cta_style,tone_rules:plan.tone_rules,prohibited:plan.prohibited,max_words:plan.max_words};
   let best:any=null,bestChecks:any=null,generationProvider='Anthropic',generationModel=clean(gov.model_id),fallbackReason='';
   for(let attempt=1;attempt<=2;attempt++){
     let out:any;
     try{
       const key=await secret(db,'ANTHROPIC_API_KEY');if(!key)throw new Error('ANTHROPIC_API_KEY_MISSING');
       out=await generateAnthropic(key,clean(gov.model_id),action,planPayload);
       generationProvider='Anthropic';generationModel=clean(gov.model_id);
     }catch(primary:any){
       if(!fallbackGov||fallbackGov.approved!==true||fallbackGov.lifecycle_status!=='ACTIVE'||fallbackGov.provider!=='Composio/Groq')throw primary;
       fallbackReason=clean(primary?.message||primary).slice(0,240);
       out=await generateGroq(db,clean(fallbackGov.model_id),action,planPayload);
       generationProvider='Composio/Groq';generationModel=clean(fallbackGov.model_id);
     }
     const body=clean(out?.body),subject=clean(out?.subject);
     const qc=deterministicChecks(body,subject,plan,action);
     if(!best||qc.score>bestChecks.score){best={...out,body,subject,attempt};bestChecks=qc}
     if(qc.pass)break;
   }
   const messageHash=hashLite(clean(best?.subject)+'|'+clean(best?.body));
   await db.from('powerhouse_message_quality_v1').upsert({action_id:actionId,composer_version:CONTRACT,play_key:plan.play_key,channel:action.channel,message_hash:messageHash,passed:bestChecks.pass,score:bestChecks.score,checks:bestChecks.checks,evidence:{provider:generationProvider,model:generationModel,fallback_reason:fallbackReason||null,why_this_works:best?.why_this_works,quality_rationale:best?.quality_rationale,attempt:best?.attempt}}, {onConflict:'action_id,message_hash'});
   const commercial={...(action.evidence?.commercial_intelligence||{}),message_strategy:plan.play_key,quality_passed:bestChecks.pass,quality_score:bestChecks.score,composer_contract:CONTRACT,message_hash:messageHash,composed_at:now,generation_provider:generationProvider,generation_model:generationModel,fallback_reason:fallbackReason||null};
   const evidence={...(action.evidence||{}),commercial_intelligence:commercial};
   if(bestChecks.pass){
     if(clean(best.subject)) evidence.email_subject=clean(best.subject);
     await db.from('powerhouse_sales_actions').update({message_draft:clean(best.body),evidence,updated_at:now}).eq('action_id',actionId);
   }else{
     await db.from('powerhouse_sales_actions').update({evidence:{...evidence,commercial_copy:{contract:CONTRACT,state:'QUALITY_HOLD',checks:bestChecks.checks,evaluated_at:now}},updated_at:now}).eq('action_id',actionId);
   }
   return J({ok:true,composed:bestChecks.pass,state:bestChecks.pass?'QUALITY_PASS':'QUALITY_HOLD',play_key:plan.play_key,score:bestChecks.score,checks:bestChecks.checks});
 }catch(e:any){return J({ok:false,contract:CONTRACT,error:clean(e?.message||e).slice(0,500),detail:safe(e)},503)}
});