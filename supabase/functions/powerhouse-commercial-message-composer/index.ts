import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-human-commercial-message-composer-v1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function secret(db:any,name:string){const e=Deno.env.get(name);if(e)return clean(e);const {data}=await db.rpc('bg_geheim',{p_naam:name});return clean(data);}
async function sha256(v:string){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function words(v:string){return clean(v).split(/\s+/).filter(Boolean).length;}
function questions(v:string){return (v.match(/\?/g)||[]).length;}
function normalize(v:string){return clean(v).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[‐‑‒–—―]/g,'-').replace(/[^a-z0-9%€$£@._+\-\s]/g,' ').replace(/\s+/g,' ').trim();}
function extractJson(text:string){const t=clean(text);try{return JSON.parse(t);}catch{}const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a>=0&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch{}}throw new Error('AI_JSON_INVALID');}
const banned=[/ik zag (je|jouw) profiel/i,/we zijn al een tijd verbonden/i,/just following up/i,/even opvolgen/i,/heb je mijn (mail|bericht)/i,/ik heb nog niets gehoord/i,/in het huidige digitale landschap/i,/revolutionair/i,/game.?changer/i,/mis deze kans niet/i,/laatste kans/i,/synergie/i,/boek (hier|nu).*(agenda|meeting|afspraak)/i,/calendly\.com/i];
function numberClaims(text:string){return [...text.matchAll(/\b\d+(?:[.,]\d+)?%?\b/g)].map(x=>x[0]);}
function canonicalNumber(v:string){const raw=clean(v).replace(/%/g,'').replace(',','.');const n=Number(raw);return Number.isFinite(n)?String(n)+(clean(v).endsWith('%')?'%':''):normalize(v);}
function quality(action:any,plan:any,out:any){
  const msg=clean(out?.message),subject=clean(out?.subject),anchor=clean(out?.personalization_anchor);
  const max=Number(plan?.max_words||100),channel=clean(action.channel_norm);
  const ev=action?.evidence||{},pub=ev?.public_source_evidence?.evidence||{};
  const humanContext={
    person_name:action.person_name,company_name:action.company_name,role:action.role,source_url:action.source_url,
    headline:ev?.headline,summary:ev?.summary,
    public_source_evidence:ev?.public_source_evidence,
    public_headline:pub?.headline,public_summary:pub?.summary,
    inbound_message:ev?.inbound?.message,reply_text:ev?.reply_text,last_message:ev?.last_message,
    action_reason:action.reason,
    relationship_evidence:ev?.relationship_evidence
  };
  const context=normalize(JSON.stringify(humanContext));
  const contextNumbers=new Set(numberClaims(JSON.stringify(humanContext)).map(canonicalNumber));
  const machineTerms=['ai_data_digitalisation','buy_sell_ma','erp_afas_change','hot_trigger','commercial_buying_window'];const machineHits=machineTerms.filter(x=>normalize(msg).includes(x)); const humanLabelHits=[/\\btrigger\\b/i,/hot.?trigger/i,/buying.?window/i,/taxonom/i,/intent.?score/i,/commercial.?state/i].filter(r=>r.test(msg)).map(r=>'internal:'+String(r));const qCount=questions(msg),bannedHits=[...banned.filter(r=>r.test(msg)).map(r=>String(r)),...machineHits.map(x=>'machine:'+x),...humanLabelHits],nums=numberClaims(msg).filter(n=>!contextNumbers.has(canonicalNumber(n)));
  const anchorNormalized=normalize(anchor);
  const anchorMachine=!anchor||anchor.includes('_')||machineTerms.includes(anchorNormalized)||/\\b(trigger|buying window|intent score|commercial state)\\b/i.test(anchor);
  const anchorTokens=anchorNormalized.split(/\\s+/).filter(x=>x.length>=3);
  const anchorTokenHits=anchorTokens.filter(x=>context.includes(x)).length;
  const anchorOk=!!anchor&&!anchorMachine&&(context.includes(anchorNormalized)||(anchorTokens.length>=2&&anchorTokenHits/anchorTokens.length>=0.8));
  const reasonNormalized=normalize(action.reason);
  const messageTokens=normalize(msg).split(/\s+/).filter((x:string)=>x.length>=4);
  const reasonEvidenceHits=messageTokens.filter((x:string)=>reasonNormalized.includes(x)).length;
  const followupEvidenceOk=plan?.play_key==='followup_new_angle'&&reasonNormalized.length>20&&reasonEvidenceHits>=3;
  const oneQuestion=plan?.cta_style==='no_question'?qCount===0:qCount<=1;
  const lengthOk=words(msg)>=8&&words(msg)<=max;
  const subjectOk=!['email','e-mail','reply_email'].includes(channel)||(words(subject)>=2&&words(subject)<=8);
  const triggerReadableOk=plan?.play_key!=='trigger_outreach'||plan?.human_readable_context===true;
  const specificOk=(plan?.play_key==='value_comment'||anchorOk||followupEvidenceOk)&&triggerReadableOk;
  const factsOk=nums.length===0,noBanned=bannedHits.length===0;
  const predictedTrigger=clean(action?.predicted_buying_trigger).toLowerCase();
  const irrelevantTrigger=plan?.source_trigger_relevance===false;
  let topicLeak=false;
  if(irrelevantTrigger&&/buy_sell_ma/.test(predictedTrigger)){
    const topic=/\b(m&a|merger|acquisit|overname|overnemen|verkooptraject|bedrijf verkopen|deal-readiness|due diligence)\b/i;
    topicLeak=topic.test(msg)&&!topic.test(context);
  }
  if(irrelevantTrigger&&/ai_data_digitalisation/.test(predictedTrigger)){
    const topic=/\b(ai[- /]?data|data governance|data-governance|use[- ]?cases?|governance|ai[- ]?initiatief|ai project|artificial intelligence|machine learning)\b/i;
    topicLeak=topic.test(msg)&&!topic.test(context);
  }
  const checks:any={length_ok:lengthOk,word_count:words(msg),max_words:max,question_count:qCount,question_rule_ok:oneQuestion,banned_ok:noBanned,banned_hits:bannedHits,subject_ok:subjectOk,personalization_anchor_ok:specificOk,followup_evidence_match:followupEvidenceOk,personalization_anchor:anchor,personalization_anchor_human:!anchorMachine,trigger_human_readable_context_ok:triggerReadableOk,semantic_topic_leak_free:!topicLeak,unsupported_numeric_claims:nums,facts_ok:factsOk,one_primary_problem_declared:clean(out?.primary_problem).length>0,micro_commitment_present:plan?.cta_style==='no_question'||clean(out?.micro_commitment).length>0,human_reason_present:clean(out?.human_reason).length>0};
  const vals=[checks.length_ok,checks.question_rule_ok,checks.banned_ok,checks.subject_ok,checks.personalization_anchor_ok,checks.personalization_anchor_human,checks.trigger_human_readable_context_ok,checks.semantic_topic_leak_free,checks.facts_ok,checks.one_primary_problem_declared,checks.micro_commitment_present,checks.human_reason_present];
  const score=vals.filter(Boolean).length/vals.length;
  const passed=score>=0.90&&lengthOk&&oneQuestion&&noBanned&&subjectOk&&specificOk&&!anchorMachine&&factsOk&&!topicLeak;
  return {passed,score:Number(score.toFixed(4)),checks};
}

const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';

async function anthropicGenerate(apiKey:string,model:string,system:string,allowed:any){
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model,max_tokens:900,temperature:0.35,system,messages:[{role:'user',content:JSON.stringify(allowed)}]}),signal:AbortSignal.timeout(45000)});
  const body:any=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error('ANTHROPIC_'+r.status+':'+clean(body?.error?.message).slice(0,220));
  return {text:clean((body?.content||[]).find((x:any)=>x.type==='text')?.text),provider:'Anthropic',model};
}
async function groqGenerate(composioKey:string,system:string,allowed:any){
  const model='openai/gpt-oss-120b';
  const r=await fetch(COMPOSIO_BASE+'/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':composioKey},
    body:JSON.stringify({version:'latest',arguments:{
      model,temperature:0.3,max_tokens:1800,stream:false,
      messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(allowed)}]
    }}),
    signal:AbortSignal.timeout(45000)
  });
  const body:any=await r.json().catch(()=>({}));
  if(!r.ok||body?.successful!==true)throw new Error('GROQ_'+r.status+':'+clean(body?.error||body?.message||JSON.stringify(body)).slice(0,220));
  const d=body?.data||body;
  const text=clean(d?.choices?.[0]?.message?.content);
  if(!text)throw new Error('GROQ_EMPTY');
  return {text,provider:'Composio/Groq',model};
}
async function generate(db:any,anthropicKey:string,anthropicModel:string,action:any,persuasion:any){
  const plan=action.message_plan||{};
  const triggerRelevant=plan?.source_trigger_relevance===true;
  const rawEvidence=action?.evidence||{};
  const safeEvidence:any={
    headline:rawEvidence?.headline||null,
    summary:rawEvidence?.summary||null,
    source_url:rawEvidence?.source_url||action.source_url||null,
    public_source_evidence:rawEvidence?.public_source_evidence||null,
    relationship_evidence:rawEvidence?.relationship_evidence||null,
    inbound:rawEvidence?.inbound||null,
    reply_text:rawEvidence?.reply_text||null,
    touch_number:rawEvidence?.touch_number||null
  };
  if(triggerRelevant){
    safeEvidence.predictive_brief=rawEvidence?.predictive_brief||null;
    safeEvidence.trigger_key=rawEvidence?.trigger_key||null;
    safeEvidence.trigger_type=rawEvidence?.trigger_type||null;
  }
  const allowed={person_name:action.person_name,company_name:action.company_name,role:action.role,channel:action.channel_norm,action_type:action.action_type,source_url:action.source_url,predicted_problem:triggerRelevant?action.predicted_problem:null,predicted_buying_trigger:triggerRelevant?action.predicted_buying_trigger:null,predicted_objection:action.predicted_objection,action_reason:action.reason,evidence:safeEvidence,play:{play_key:plan.play_key,play_name:plan.play_name,objective:plan.objective,psychology:persuasion?.principles||plan.psychology,message_structure:plan.message_structure,cta_style:plan.cta_style,tone_rules:plan.tone_rules,prohibited:[...(Array.isArray(plan.prohibited)?plan.prohibited:[]),...(Array.isArray(persuasion?.do_not_use)?persuasion.do_not_use:[])],max_words:plan.max_words,source_trigger_relevance:triggerRelevant},canonical_persuasion:persuasion||null,brand_voice:plan.brand_voice,quality_contract:plan.quality_contract};
  const system='Je bent de Human Commercial Composer van Bedrijfsgeheugen. Gebruik alleen leesbare prospectcontext zoals een echte headline, samenvatting, concreet openbaar feit, eerder gesprek of relatiecontext. Toon nooit interne taxonomylabels, snake_case, scores, source keys of het woord trigger als intern systeembegrip. Schrijf als een slimme, sympathieke Nederlandse ondernemer; niet als een salesbot. Gebruik ALLEEN aangeleverde feiten. Verzin nooit persoonsdetails, gebeurtenissen, cijfers, urgentie, bewijs of problemen. Een hypothese moet hoorbaar als hypothese klinken (kan, mogelijk, ik vraag me af of). Externe AI-content of een AI-product is nooit automatisch bewijs van een intern data-, governance- of implementatieprobleem. Als source_trigger_relevance false is, negeer voorspelde problemen/triggers volledig en schrijf alleen vanuit de leesbare bron- of relatiecontext. Doel: de kleinste logische commitment, niet meteen een afspraak. Pas exact de gekozen sales play en psychologische mechanismen toe zonder manipulatief te worden. Menselijk: korte zinnen, spreektaal, concreet, warm, licht droge humor alleen als die vanzelf past. Nooit humor ten koste van de prospect. Verboden: generieke complimenten/openingen, dienstencatalogus, AI-hype, corporate jargon, nep-schaarste, schuldgevoel bij geen reactie, agendalink, meerdere CTAs. LinkedIn-DM: maximaal 80 woorden. E-mail: maximaal het opgegeven maximum. Eén vraag maximaal. Follow-up: altijd nieuwe invalshoek; nooit even opvolgen, heb je mijn mail gezien of verwijt. Graceful close: geen vraag. DMs mogen niet eindigen als reclame voor Bedrijfsgeheugen. Geef uitsluitend JSON met keys: subject, message, personalization_anchor, fact_used, hypothesis_used, primary_problem, micro_commitment, predicted_objection, objection_response, human_reason. personalization_anchor moet een KORTE LETTERLIJKE frase zijn uit de aangeleverde context die de tekst werkelijk uniek maakt.';
  let generated:any=null,primaryError='';
  try{
    if(!anthropicKey)throw new Error('ANTHROPIC_KEY_MISSING');
    generated=await anthropicGenerate(anthropicKey,anthropicModel,system,allowed);
  }catch(e:any){
    primaryError=clean(e?.message||e);
    const composioKey=await secret(db,'COMPOSIO_API_KEY');
    if(!composioKey)throw new Error(primaryError+'; GROQ_FALLBACK_KEY_MISSING');
    generated=await groqGenerate(composioKey,system,allowed);
  }
  return {output:extractJson(generated.text),provider:generated.provider,model:generated.model,primary_error:primaryError||null};
}
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}}),expected=await secret(db,'powerhouse_daily_scheduler_token');
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);
  let input:any={};try{input=await req.json();}catch{}
  const limit=Math.max(1,Math.min(Number(input?.limit||10),50)),channels=Array.isArray(input?.channels)?input.channels.map((x:any)=>normalize(x).replace(/\s+/g,'_')):[],actionIds=Array.isArray(input?.action_ids)?input.action_ids.map(clean).filter(Boolean):[],dryRun=input?.dry_run===true,now=new Date().toISOString();
  try{
    await db.rpc('powerhouse_refresh_message_plans_v1',{p_limit:Math.max(limit,50)});
    const apiKey=await secret(db,'ANTHROPIC_API_KEY');if(!apiKey)throw new Error('ANTHROPIC_API_KEY_MISSING');
    const {data:gov,error:gErr}=await db.from('brain_ai_governance_registry').select('model_id,provider,approved,lifecycle_status').eq('tenant_id','canonical').eq('use_case_id','supabase-bg-native-content-generate-v4').maybeSingle();
    if(gErr||!gov||gov.approved!==true||gov.lifecycle_status!=='ACTIVE'||gov.provider!=='Anthropic')throw new Error('AI_GOVERNANCE_UNAVAILABLE');
    const {data,error}=await db.rpc('powerhouse_commercial_message_candidates_v1',{p_limit:limit,p_channels:channels.length?channels:null,p_action_ids:actionIds.length?actionIds:null});
    if(error)throw new Error('PLAN_READ:'+error.message);
    let rows=(data||[]);
    rows=rows.filter((a:any)=>a.evidence?.commercial_intelligence?.composer?.quality_passed!==true||!clean(a.message_draft));
    if(dryRun)return json({ok:true,contract:CONTRACT,dry_run:true,candidates:rows.map((a:any)=>({action_id:a.action_id,play_key:a.play_key,channel:a.channel_norm}))});
    const out:any[]=[];
    for(const action of rows){
      try{
        let workingAction:any=action;
        const sourceRef=clean(action?.evidence?.source_ref);
        const match=sourceRef.match(/^powerhouse_runtime_event:([0-9a-f-]{36})$/i);
        if(match){
          const {data:sourceEvent}=await db.from('powerhouse_runtime_events').select('event_id,event_type,source,occurred_at,evidence,context').eq('event_id',match[1]).maybeSingle();
          if(sourceEvent){
            workingAction={...action,evidence:{...(action.evidence||{}),public_source_evidence:{event_id:sourceEvent.event_id,event_type:sourceEvent.event_type,source:sourceEvent.source,occurred_at:sourceEvent.occurred_at,evidence:sourceEvent.evidence,context:sourceEvent.context}}};
          }
        }
        const {data:persuasionRaw,error:persuasionError}=await db.rpc('powerhouse_persuasion_revenue_optimizer_v1',{
          p_company_key:clean(workingAction.company_key),
          p_play_key:clean(workingAction.play_key||workingAction.message_plan?.play_key||'value_first'),
          p_channel:clean(workingAction.channel_norm),
          p_funnel_stage:clean(workingAction.stage_hint||'consideration')
        });
        if(persuasionError)throw new Error('PERSUASION_AUTHORITY:'+persuasionError.message);
        const persuasion=persuasionRaw||{};
        const gen=await generate(db,apiKey,clean(gov.model_id),workingAction,persuasion),generated=gen.output,qv=quality(workingAction,workingAction.message_plan,generated),message=clean(generated.message),hash=await sha256(message);
        await db.from('powerhouse_message_quality_v1').upsert({action_id:action.action_id,composer_version:CONTRACT,play_key:action.play_key,channel:action.channel_norm,message_hash:hash,passed:qv.passed,score:qv.score,checks:qv.checks,evidence:{model:gen.model,provider:gen.provider,primary_provider_error:gen.primary_error,generated_at:now,personalization_anchor:generated.personalization_anchor,fact_used:generated.fact_used,hypothesis_used:generated.hypothesis_used,primary_problem:generated.primary_problem,micro_commitment:generated.micro_commitment,predicted_objection:generated.predicted_objection,objection_response:generated.objection_response,human_reason:generated.human_reason}},{onConflict:'action_id,message_hash'});
        const ci={...(action.evidence?.commercial_intelligence||{}),message_strategy:action.play_key,persuasion_authority:{contract:'powerhouse-persuasion-revenue-optimizer-v1',play_key:clean(persuasion?.play_key),principles:persuasion?.principles||[],primary_message_strategy:clean(persuasion?.primary_message_strategy),micro_cta:clean(persuasion?.micro_cta),do_not_use:persuasion?.do_not_use||[],confidence:persuasion?.confidence??null,truth_boundary:clean(persuasion?.truth_boundary)},predicted_objection:clean(generated.predicted_objection),objection_response:clean(generated.objection_response),quality_passed:qv.passed,quality_score:qv.score,message_hash:hash,composer_contract:CONTRACT,composer:{contract:CONTRACT,model:gen.model,provider:gen.provider,primary_provider_error:gen.primary_error,quality_passed:qv.passed,quality_score:qv.score,message_hash:hash,generated_at:now,personalization_anchor:clean(generated.personalization_anchor),micro_commitment:clean(generated.micro_commitment),human_reason:clean(generated.human_reason)}};
        const evidence={...(action.evidence||{}),commercial_intelligence:ci};if(['email','e-mail','reply_email'].includes(action.channel_norm))evidence.email_subject=clean(generated.subject)||clean(action.evidence?.email_subject);
        const update:any={evidence,updated_at:now};if(qv.passed)update.message_draft=message;else if(clean(action.message_draft))update.message_draft='';
        const {error:uErr}=await db.from('powerhouse_sales_actions').update(update).eq('action_id',action.action_id);if(uErr)throw new Error('ACTION_WRITE:'+uErr.message);
        out.push({action_id:action.action_id,channel:action.channel_norm,play_key:action.play_key,quality_passed:qv.passed,quality_score:qv.score,word_count:qv.checks.word_count,personalization_anchor:qv.checks.personalization_anchor});
      }catch(e:any){out.push({action_id:action.action_id,status:'error',error:clean(e?.message||e).slice(0,300)});}
    }
    return json({ok:true,contract:CONTRACT,processed:out.length,passed:out.filter(x=>x.quality_passed).length,results:out});
  }catch(e:any){return json({ok:false,contract:CONTRACT,error:clean(e?.message||e).slice(0,500)},503);}
});