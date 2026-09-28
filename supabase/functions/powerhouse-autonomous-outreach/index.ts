import { createClient } from 'npm:@supabase/supabase-js@2';

const CONTRACT='powerhouse-autonomous-relationship-outreach-v1';
const COMPOSIO_BASE='https://backend.composio.dev/api/v3.1';
const clean=(v:unknown)=>String(v??'').trim();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});

async function secret(db:any,name:string){
  const env=Deno.env.get(name);
  if(env)return clean(env);
  const {data}=await db.rpc('bg_geheim',{p_naam:name});
  return clean(data);
}
async function resolveGmail(db:any,apiKey:string){
  const pinned=await secret(db,'COMPOSIO_GMAIL_CONNECTED_ACCOUNT_ID');
  if(pinned)return pinned;
  const response=await fetch(COMPOSIO_BASE+'/connected_accounts?toolkit_slugs=gmail&statuses=ACTIVE&account_type=ALL&limit=20',{headers:{'x-api-key':apiKey}});
  const body:any=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error('COMPOSIO_GMAIL_DISCOVERY_'+response.status);
  const items=Array.isArray(body?.items)?body.items:Array.isArray(body?.data?.items)?body.data.items:Array.isArray(body?.data)?body.data:[];
  const active=items.filter((x:any)=>clean(x?.status).toUpperCase()==='ACTIVE'&&x?.is_disabled!==true);
  if(active.length===0)throw new Error('COMPOSIO_GMAIL_CONNECTION_REQUIRED');
  if(active.length>1)throw new Error('COMPOSIO_GMAIL_CONNECTION_AMBIGUOUS');
  return clean(active[0]?.id||active[0]?.connected_account_id);
}
function pick(obj:any,keys:string[]):string{
  if(!obj)return'';
  if(typeof obj==='object'){
    for(const k of keys)if(typeof obj[k]==='string'&&clean(obj[k]))return clean(obj[k]);
    for(const v of Object.values(obj)){const x=pick(v,keys);if(x)return x;}
  }
  return'';
}
const PDF_ASSETS=new Set(['board_one_pager','evidence_teardown','lost_knowledge_case','friction_business_case','mini_benchmark','peer_benchmark']);

function assetNeedsPdf(evidence:any){
  const explicit=clean(evidence?.asset_format).toLowerCase();
  if(explicit==='pdf')return true;
  return PDF_ASSETS.has(clean(evidence?.give_asset).toLowerCase());
}
function safeEvidenceLines(evidence:any){
  const rows:any[]=[];
  for(const [label,key] of [
    ['Aanleiding','trigger_type'],
    ['Publiek signaal','headline'],
    ['Samenvatting','summary'],
    ['Bron','source_url'],
    ['Strategie','persuasion_strategy']
  ]){
    const value=clean(evidence?.[key]);
    if(value)rows.push({label,value});
  }
  return rows;
}
function buildPdfMarkdown(action:any){
  const e=action.evidence||{};
  const asset=clean(e.give_asset)||'evidence_one_pager';
  const company=clean(action.company_name)||'Organisatie';
  const person=clean(action.person_name);
  const lines=safeEvidenceLines(e);
  const factual=lines.length?lines.map((x:any)=>`- **${x.label}:** ${x.value}`).join('\n'):'- Er zijn nog onvoldoende harde openbare feiten om aanvullende claims te doen.';
  return `# Bedrijfsgeheugen — ${asset.replaceAll('_',' ')}\n\n**Voor:** ${company}${person?' — '+person:''}\n\n## Waarom dit document\nDit document is automatisch samengesteld door Powerhouse als waardevolle vervolgstap. Alleen beschikbare broninformatie en expliciete aannames worden gebruikt; ontbrekende feiten worden niet ingevuld.\n\n## Beschikbare signalen\n${factual}\n\n## Wat nu relevant is\n${clean(action.message_draft)||'Bekijk eerst de beschikbare signalen en bepaal daarna de kleinste zinvolle vervolgstap.'}\n\n## Volgende stap\n${clean(e.get_ask)||'Geen verplichting; gebruik dit document als interne bespreekbasis.'}\n\n---\nBedrijfsgeheugen.nl — automatisch gegenereerd, evidence-bounded.\n`;
}
function deepFile(obj:any):any{
  if(!obj)return null;
  if(typeof obj==='object'){
    if(typeof obj.s3key==='string'&&clean(obj.s3key)){
      return {name:clean(obj.name)||clean(obj.filename)||'bedrijfsgeheugen.pdf',mimetype:clean(obj.mimetype)||clean(obj.mime_type)||'application/pdf',s3key:clean(obj.s3key)};
    }
    for(const v of Object.values(obj)){const found=deepFile(v);if(found)return found;}
  }
  return null;
}
async function convertTextToPdf(apiKey:string,markdown:string){
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/TEXT_TO_PDF_CONVERT_TEXT_TO_PDF',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({version:'latest',arguments:{file_type:'markdown',text:markdown}})
  });
  const payload:any=await response.json().catch(()=>({}));
  if(!response.ok||payload?.successful!==true){
    throw new Error('COMPOSIO_TEXT_TO_PDF_'+response.status+':'+clean(payload?.error||payload?.message||JSON.stringify(payload)).slice(0,300));
  }
  const file=deepFile(payload?.data||payload);
  if(!file||file.mimetype!=='application/pdf')throw new Error('COMPOSIO_PDF_FILE_MISSING');
  return file;
}

async function sendEmail(apiKey:string,accountId:string,recipient:string,subject:string,body:string,attachment:any=null){
  const response=await fetch(COMPOSIO_BASE+'/tools/execute/GMAIL_SEND_EMAIL',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({
      connected_account_id:accountId,
      version:'latest',
      arguments:{recipient_email:recipient,subject,body,is_html:false,user_id:'me',...(attachment?{attachment}:{} )}
    })
  });
  const payload:any=await response.json().catch(()=>({}));
  if(!response.ok||payload?.successful!==true){
    throw new Error('COMPOSIO_GMAIL_SEND_'+response.status+':'+clean(payload?.error||payload?.message||JSON.stringify(payload)).slice(0,300));
  }
  const data=payload?.data||payload;
  return {message_id:pick(data,['id','message_id','messageId']),thread_id:pick(data,['threadId','thread_id']),provider_response:data};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({ok:false,error:'POST_ONLY'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!service)return json({ok:false,error:'CONFIG'},500);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const expected=await secret(db,'powerhouse_daily_scheduler_token');
  if(!expected||req.headers.get('x-powerhouse-token')!==expected)return json({ok:false,error:'UNAUTHORIZED'},401);

  let input:any={};
  try{input=await req.json();}catch{}
  const dryRun=input?.dry_run===true;
  const now=new Date().toISOString();

  try{
    const apiKey=await secret(db,'COMPOSIO_API_KEY');
    if(!apiKey)throw new Error('COMPOSIO_API_KEY_MISSING');
    const accountId=await resolveGmail(db,apiKey);

    const {data:actions,error}=await db.from('powerhouse_sales_actions')
      .select('action_id,dedupe_key,person_key,company_key,person_name,company_name,message_draft,evidence,status,priority')
      .eq('action_type','autonomous_email').eq('channel','email').eq('status','prepared')
      .lte('due_at',now).order('priority',{ascending:false}).limit(5);
    if(error)throw new Error('OUTREACH_READ:'+error.message);

    if(dryRun){
      return json({ok:true,dry_run:true,eligible:(actions||[]).length,account_resolved:true,external_outreach_executed:false});
    }

    const results:any[]=[];
    for(const action of actions||[]){
      const recipient=clean(action.evidence?.recipient_email);
      const subject=clean(action.evidence?.email_subject);
      const body=clean(action.message_draft);
      if(!recipient||!subject||!body){
        await db.from('powerhouse_sales_actions').update({status:'error',evidence:{...(action.evidence||{}),outbound_error:'MISSING_RECIPIENT_SUBJECT_OR_BODY',failed_at:now},updated_at:now}).eq('action_id',action.action_id);
        results.push({action_id:action.action_id,status:'error',reason:'MISSING_RECIPIENT_SUBJECT_OR_BODY'});
        continue;
      }

      const {data:claimed,error:claimError}=await db.from('powerhouse_sales_actions')
        .update({status:'waiting',updated_at:now})
        .eq('action_id',action.action_id).eq('status','prepared')
        .select('action_id').maybeSingle();
      if(claimError)throw new Error('OUTREACH_CLAIM:'+claimError.message);
      if(!claimed){results.push({action_id:action.action_id,status:'skipped',reason:'ALREADY_CLAIMED'});continue;}

      try{
        let attachment:any=null;
        let generatedAsset:any=null;
        if(assetNeedsPdf(action.evidence)){
          const markdown=buildPdfMarkdown(action);
          attachment=await convertTextToPdf(apiKey,markdown);
          generatedAsset={
            format:'pdf',
            give_asset:clean(action.evidence?.give_asset),
            filename:attachment.name,
            mimetype:attachment.mimetype,
            s3key_present:true,
            generated_at:now,
            generator:'composio-text-to-pdf',
            autonomous:true
          };
        }
        const sent=await sendEmail(apiKey,accountId,recipient,subject,body,attachment);
        const providerId=sent.message_id||sent.thread_id;
        if(!providerId)throw new Error('GMAIL_PROVIDER_ID_MISSING');

        const evidence={...(action.evidence||{}),autonomous_outbound:{
          contract:CONTRACT,provider:'composio-gmail',provider_message_id:sent.message_id,provider_thread_id:sent.thread_id,
          provider_ack_verified:true,sent_at:now,republish_forbidden:true,user_authorized:true,asset:generatedAsset
        }};
        const {error:uErr}=await db.from('powerhouse_sales_actions')
          .update({status:'done',executed_at:now,evidence,updated_at:now})
          .eq('action_id',action.action_id).eq('status','waiting');
        if(uErr)throw new Error('OUTREACH_WRITEBACK:'+uErr.message);

        await db.from('powerhouse_sales_outcomes').upsert({
          dedupe_key:'autonomous-email-sent:'+action.action_id,
          action_id:action.action_id,outcome_type:'sent',
          subject_key:'relationship:'+action.person_key,person_key:action.person_key,company_key:action.company_key,
          revenue_eur:0,evidence:{contract:CONTRACT,provider:'composio-gmail',provider_message_id:sent.message_id,provider_thread_id:sent.thread_id},
          occurred_at:now,channel:'email'
        },{onConflict:'dedupe_key'});

        results.push({action_id:action.action_id,status:'sent',provider_message_id:sent.message_id,provider_thread_id:sent.thread_id,pdf_attached:Boolean(generatedAsset)});
      }catch(err:any){
        const message=clean(err?.message||err).slice(0,500);
        await db.from('powerhouse_sales_actions').update({
          status:'error',evidence:{...(action.evidence||{}),autonomous_outbound:{contract:CONTRACT,failed_at:now,error:message,user_authorized:true}},updated_at:now
        }).eq('action_id',action.action_id).eq('status','waiting');
        results.push({action_id:action.action_id,status:'error',reason:message});
      }
    }

    const sent=results.filter(x=>x.status==='sent').length;
    await db.from('bg_gezondheid').insert({
      gemeten_op:now,onderdeel:'powerhouse-autonomous-outreach',soort:'commercial-execution',
      status:results.some(x=>x.status==='error')?'waarschuwing':'ok',
      detail:`selected=${(actions||[]).length}; sent=${sent}; errors=${results.filter(x=>x.status==='error').length}`,
      gegevens:{contract:CONTRACT,selected:(actions||[]).length,sent,results,user_authorized:true}
    });
    return json({ok:true,contract:CONTRACT,selected:(actions||[]).length,sent,results,external_outreach_executed:sent>0});
  }catch(err:any){
    return json({ok:false,contract:CONTRACT,error:clean(err?.message||err).slice(0,500)},503);
  }
});
