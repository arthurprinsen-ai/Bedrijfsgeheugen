import { createClient } from 'npm:@supabase/supabase-js@2';
import { authorizePowerhouseScheduler } from '../_shared/powerhouse-scheduler-auth.ts';

const CONTRACT='powerhouse-email-reply-learning-v1';
const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});

const SECRET_CACHE_MS=15*60_000;
const secretCache=new Map<string,{value:string,until:number}>();
async function secret(db:any,name:string){
  const env=Deno.env.get(name); if(env)return clean(env);
  const cached=secretCache.get(name);if(cached&&Date.now()<cached.until)return cached.value;
  const {data,error}=await db.rpc('bg_geheim',{p_naam:name});if(error)throw new Error('SECRET_LOOKUP_FAILED:'+name);
  const value=clean(data);if(value)secretCache.set(name,{value,until:Date.now()+SECRET_CACHE_MS});return value;
}
async function resolveGmail(db:any,apiKey:string){
  const pinned=await secret(db,'COMPOSIO_GMAIL_CONNECTED_ACCOUNT_ID');
  const r=await fetch(COMPOSIO_BASE+'/connected_accounts?toolkit_slugs=gmail&statuses=ACTIVE&account_type=ALL&limit=20',{headers:{'x-api-key':apiKey}});
  const b:any=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error('GMAIL_DISCOVERY_HTTP_'+r.status);
  const items=Array.isArray(b?.items)?b.items:Array.isArray(b?.data?.items)?b.data.items:Array.isArray(b?.data)?b.data:[];
  const active=items.filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&x?.is_disabled!==true);
  if(active.length===0)throw new Error('GMAIL_CONNECTION_REQUIRED');
  const pinnedActive=active.find((x:any)=>clean(x?.id||x?.connected_account_id)===pinned);
  if(pinnedActive)return clean(pinnedActive?.id||pinnedActive?.connected_account_id);
  if(active.length>1)throw new Error('GMAIL_CONNECTION_AMBIGUOUS');
  return clean(active[0]?.id||active[0]?.connected_account_id);
}
async function gmailFetch(apiKey:string,accountId:string,query:string){
  const r=await fetch(COMPOSIO_BASE+'/tools/execute/GMAIL_FETCH_EMAILS',{
    method:'POST',headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({connected_account_id:accountId,version:'latest',arguments:{
      user_id:'me',query,max_results:100,include_payload:true,include_spam_trash:false,verbose:true
    }})
  });
  const b:any=await r.json().catch(()=>({}));
  if(!r.ok||b?.successful!==true)throw new Error('GMAIL_FETCH_FAILED_'+r.status);
  const d=b?.data||b;
  return Array.isArray(d?.messages)?d.messages:[];
}
function emailOf(v:unknown){
  const s=clean(v).toLowerCase();
  const m=s.match(/[a-z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m?m[0].toLowerCase():'';
}
function normSubject(v:unknown){
  return clean(v).toLowerCase().replace(/^\s*((re|fw|fwd)\s*:\s*)+/i,'').replace(/\s+/g,' ').trim();
}
function classify(textRaw:string){
  const t=(' '+clean(textRaw).toLowerCase().replace(/\s+/g,' ')+' ');
  const hit=(xs:string[])=>xs.some(x=>t.includes(x));
  if(hit([' uitschrijven',' afmelden',' niet meer mailen',' verwijder mij',' unsubscribe',' stop emailing',' do not contact',' no more emails']))
    return {reply_class:'unsubscribe',objection_code:'do_not_contact',intent_score:-1,next_action:'suppress'};
  if(hit([' te duur',' prijs',' budget',' kosten',' too expensive',' pricing',' budget']))
    return {reply_class:'objection_price',objection_code:'price_budget',intent_score:-0.2,next_action:'follow_up'};
  if(hit([' later',' nu niet',' geen tijd',' druk',' volgend kwartaal',' volgend jaar',' not now',' later on',' too busy']))
    return {reply_class:'objection_timing',objection_code:'timing',intent_score:0,next_action:'nurture_later'};
  if(hit([' niet relevant',' geen behoefte',' geen interesse',' no interest',' not relevant',' no need',' niet nodig']))
    return {reply_class:'objection_need',objection_code:'need_fit',intent_score:-0.7,next_action:'close'};
  if(hit([' niet bij mij',' verkeerde persoon',' collega',' contact opnemen met',' not me',' wrong person',' speak to']))
    return {reply_class:'objection_authority',objection_code:'authority',intent_score:0.1,next_action:'reroute'};
  if(hit([' graag',' interessant',' klinkt goed',' stuur maar',' laten we',' afspraak',' bellen',' meeting',' interested',' sounds good',' yes please',' sure',' happy to',' let\'s talk']))
    return {reply_class:'positive',objection_code:null,intent_score:0.85,next_action:'follow_up'};
  if(t.includes('?'))
    return {reply_class:'question',objection_code:null,intent_score:0.45,next_action:'follow_up'};
  if(hit([' nee dank',' nee bedankt',' no thanks',' not interested',' liever niet']))
    return {reply_class:'negative',objection_code:'negative',intent_score:-0.8,next_action:'close'};
  return {reply_class:'other',objection_code:null,intent_score:0,next_action:'review'};
}
function followupDraft(cls:string,name:string){
  const first=clean(name).split(/\s+/)[0]||'';
  if(cls==='positive')return `Hoi ${first},\n\nDank voor je reactie. Goed. Ik pak de kern erbij en maak de volgende stap zo concreet mogelijk. Wat heeft je voorkeur: kort per mail of 15 minuten samen erdoorheen?\n\nGroet,\nArthur`;
  if(cls==='question')return `Hoi ${first},\n\nDank voor je reactie. Ik pak je vraag gericht op en koppel hem aan het concrete signaal waar mijn eerdere mail op gebaseerd was.\n\nGroet,\nArthur`;
  if(cls==='objection_price')return `Hoi ${first},\n\nHelder, dank. Dan heeft het alleen zin als ik eerst laat zien waar de concrete waarde zit en wat je juist níet hoeft te doen. Ik kan dat compact terugbrengen tot één onderbouwde businesscase.\n\nGroet,\nArthur`;
  return '';
}
function isoAfterDays(days:number){
  const d=new Date(Date.now()-days*86400000); return d.toISOString().slice(0,10).replaceAll('-','/');
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const auth=await authorizePowerhouseScheduler(req);
  if(!auth.ok)return json({ok:false,error:auth.error},auth.status);
  const url=Deno.env.get('SUPABASE_URL')||'', service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});

  try{
    const apiKey=await secret(db,'COMPOSIO_API_KEY'); if(!apiKey)throw new Error('COMPOSIO_API_KEY_MISSING');
    const accountId=await resolveGmail(db,apiKey);
    const since=new Date(Date.now()-14*86400000).toISOString();

    const {data:actions,error:aErr}=await db.from('powerhouse_sales_actions')
      .select('action_id,subject_key,person_key,company_key,content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role,evidence,executed_at')
      .eq('channel','email').eq('action_type','autonomous_email').eq('status','done')
      .gte('executed_at',since).order('executed_at',{ascending:false}).limit(100);
    if(aErr)throw new Error('ACTIONS_READ:'+aErr.message);

    const eligible=(actions||[]).filter((a:any)=>clean(a?.evidence?.recipient_email)&&clean(a?.evidence?.email_subject)&&a.executed_at);
    const byEmail=new Map<string,any[]>();
    for(const a of eligible){
      const e=clean(a.evidence.recipient_email).toLowerCase();
      if(!byEmail.has(e))byEmail.set(e,[]);
      byEmail.get(e)!.push(a);
    }

    const emails=[...byEmail.keys()];
    const inbox:any[]=[];
    for(const senderEmail of emails){
      inbox.push(...await gmailFetch(apiKey,accountId,`after:${isoAfterDays(14)} from:${senderEmail}`));
    }

    let ingested=0,duplicates=0,followups=0,suppressions=0;
    const results:any[]=[];
    for(const msg of inbox){
      const messageId=clean(msg?.messageId||msg?.id); if(!messageId)continue;
      const sender=emailOf(msg?.sender||msg?.from); if(!sender)continue;
      const candidates=byEmail.get(sender)||[]; if(!candidates.length)continue;
      const mSubject=normSubject(msg?.subject||msg?.preview?.subject);
      const occurred=new Date(clean(msg?.messageTimestamp||msg?.internalDate)||Date.now());
      if(Number.isNaN(occurred.getTime()))continue;

      const action=candidates.find((a:any)=>{
        const sentAt=new Date(a.executed_at);
        return occurred>sentAt && normSubject(a.evidence?.email_subject)===mSubject;
      });
      if(!action)continue;

      const {data:exists}=await db.from('powerhouse_email_reply_events')
        .select('reply_event_id').eq('provider','gmail').eq('provider_message_id',messageId).maybeSingle();
      if(exists){duplicates++;continue;}

      const text=clean(msg?.messageText||msg?.preview?.body);
      const c=classify(text);
      const {data:reply,error:rErr}=await db.from('powerhouse_email_reply_events').insert({
        action_id:action.action_id,provider:'gmail',provider_message_id:messageId,
        provider_thread_id:clean(msg?.threadId)||null,sender_email:sender,
        subject:clean(msg?.subject),reply_text:text,reply_class:c.reply_class,
        objection_code:c.objection_code,intent_score:c.intent_score,next_action:c.next_action,
        occurred_at:occurred.toISOString(),classification_evidence:{
          contract:CONTRACT,classifier:'deterministic-v1',message_timestamp:clean(msg?.messageTimestamp),
          original_subject:clean(action.evidence?.email_subject),persuasion_strategy:clean(action.evidence?.persuasion_strategy),
          give_asset:clean(action.evidence?.give_asset),trigger_type:clean(action.evidence?.trigger_type),get_ask:clean(action.evidence?.get_ask)
        }
      }).select('reply_event_id').single();
      if(rErr)throw new Error('REPLY_INSERT:'+rErr.message);
      ingested++;

      await db.from('powerhouse_sales_outcomes').upsert({
        dedupe_key:'email-reply:'+messageId,action_id:action.action_id,
        outcome_type:'reply_'+c.reply_class,subject_key:action.subject_key,person_key:action.person_key,company_key:action.company_key,
        content_key:action.content_key,topic_key:action.topic_key,campaign_key:action.campaign_key,opportunity_key:action.opportunity_key,
        revenue_eur:0,channel:'email',occurred_at:occurred.toISOString(),
        evidence:{contract:CONTRACT,reply_event_id:reply.reply_event_id,provider_message_id:messageId,provider_thread_id:clean(msg?.threadId),reply_class:c.reply_class}
      },{onConflict:'dedupe_key'});

      if(c.reply_class==='unsubscribe'){
        await db.from('powerhouse_email_contact_suppressions').upsert({
          email:sender,reason:'explicit_unsubscribe',source_reply_event_id:reply.reply_event_id,active:true,lifted_at:null
        },{onConflict:'email'});
        suppressions++;
      }

      if(['positive','question','objection_price'].includes(c.reply_class)){
        const draft=followupDraft(c.reply_class,action.person_name);
        await db.from('powerhouse_sales_actions').upsert({
          dedupe_key:'email-reply-followup:'+messageId,
          subject_key:action.subject_key,person_key:action.person_key,company_key:action.company_key,
          content_key:action.content_key,topic_key:action.topic_key,campaign_key:action.campaign_key,opportunity_key:action.opportunity_key,
          action_type:'reply_followup',channel:'email',priority:c.reply_class==='positive'?0.98:0.82,
          reason:'Inbound commercial email reply requires context-aware follow-up.',
          evidence:{contract:CONTRACT,parent_action_id:action.action_id,reply_event_id:reply.reply_event_id,reply_class:c.reply_class,
            recipient_email:sender,email_subject:'Re: '+clean(action.evidence?.email_subject),provider_thread_id:clean(msg?.threadId),
            source_message_id:messageId,autonomous_send_allowed:false},
          message_draft:draft,source_url:'gmail://thread/'+clean(msg?.threadId),status:'prepared',
          due_at:new Date().toISOString(),expected_value_eur:Number(action.expected_value_eur||0),
          person_name:action.person_name,company_name:action.company_name,role:action.role
        },{onConflict:'dedupe_key'});
        followups++;
      }
      results.push({action_id:action.action_id,message_id:messageId,reply_class:c.reply_class,next_action:c.next_action});
    }

    const {error:refreshErr}=await db.rpc('powerhouse_refresh_email_learning_stats');
    if(refreshErr)throw new Error('LEARNING_REFRESH:'+refreshErr.message);

    const {data:stats}=await db.from('powerhouse_email_learning_stats').select('*').order('sent_count',{ascending:false}).limit(100);
    for(const s of stats||[]){
      const sample=Math.max(1,Number(s.sent_count||0));
      const confidence=Math.min(0.95,0.2+Math.min(sample,75)/100);
      const status=sample>=5?'active':'hypothesis';
      await db.from('powerhouse_sales_learnings').upsert({
        fingerprint:'email-reply-loop:'+s.learning_key,
        scope:'email_outreach_variant',
        hypothesis:`Emailvariant ${clean(s.persuasion_strategy)} / ${clean(s.give_asset)} / ${clean(s.trigger_type)} / ${clean(s.get_ask)} moet op omzet en orders worden geoptimaliseerd; replies zijn alleen tussensignalen.`,
        evidence:{contract:CONTRACT,learning_key:s.learning_key,window_days:180},
        effect:{sent_count:s.sent_count,reply_count:s.reply_count,positive_reply_count:s.positive_reply_count,meeting_count:s.meeting_count,
          proposal_count:s.proposal_count,order_count:s.order_count,revenue_eur:s.revenue_eur,reply_rate:s.reply_rate,
          positive_reply_rate:s.positive_reply_rate,revenue_per_send_eur:s.revenue_per_send_eur},
        confidence,status,channel:'email',sample_size:sample
      },{onConflict:'fingerprint'});
    }

    await db.from('bg_gezondheid').insert({
      gemeten_op:new Date().toISOString(),onderdeel:'powerhouse-email-reply-loop',soort:'commercial-learning',
      status:'ok',detail:`eligible=${eligible.length}; inbox=${inbox.length}; ingested=${ingested}; followups=${followups}; suppressions=${suppressions}`,
      gegevens:{contract:CONTRACT,eligible:eligible.length,inbox_messages:inbox.length,ingested,duplicates,followups,suppressions,results}
    });

    return json({ok:true,contract:CONTRACT,eligible:eligible.length,inbox_messages:inbox.length,ingested,duplicates,followups,suppressions,results});
  }catch(err:any){
    const internal=clean(err?.message||err).slice(0,300);
    console.error('POWERHOUSE_EMAIL_REPLY_LOOP_FAILED',internal);
    try{await db.from('bg_gezondheid').insert({
      gemeten_op:new Date().toISOString(),
      onderdeel:'powerhouse-email-reply-loop',
      soort:'commercial-learning',
      status:'fout',
      detail:'EMAIL_REPLY_LOOP_FAILED',
      gegevens:{contract:CONTRACT,failure_class:'runtime_dependency'}
    });}catch{}
    return json({ok:false,contract:CONTRACT,error:'EMAIL_REPLY_LOOP_FAILED'},503);
  }
});
