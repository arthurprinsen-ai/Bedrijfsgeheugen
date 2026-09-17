import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_AGE=96*60*60*1000;
const MIRA_PROOF_MAX_AGE=24*60*60*1000;
const MIRA_CLOCK_SKEW=5*60*1000;
const PARENT_CONTRACT='channel-identity-hard-gate-v3';
const PERSONAL_CONTRACT='arthur-personal-linkedin-identity-v4';
const PERSONAL_CHANNEL='6a70381699afb44349f0fb35';
const COMPANY_CHANNEL='6a70381699afb44349f0fb36';
const INSTAGRAM_CHANNEL='6a70384d99afb44349f0fba9';
const json=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const clean=v=>String(v??'').trim();

async function digest(v){
  const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

const CHANNEL_ALIASES={
  linkedin_personal:'linkedin_personal',
  [PERSONAL_CHANNEL]:'linkedin_personal',
  arthurprinsen:'linkedin_personal',
  linkedin_company:'linkedin_company',
  [COMPANY_CHANNEL]:'linkedin_company',
  bedrijfsgeheugen:'linkedin_company',
  instagram_company:'instagram_company',
  instagram:'instagram_company',
  [INSTAGRAM_CHANNEL]:'instagram_company',
  'bedrijfsgeheugen.nl':'instagram_company',
  instagram_personal:'instagram_personal'
};

function businessSignal(text){
  return /\b(Bedrijfsgeheugen|directeur(?:en)?|eigenaar(?:s)?|mkb|bedrijf(?:ven|s)?|organisatie(?:s)?|omzet|lead(?:s)?|klant(?:en)?|prospect(?:s)?|strategie|management|consultancy|digitalisering|AI|data|dashboard|bedrijfsproces(?:sen)?|processen op orde|operationele frictie|frictie.*bedrijfsvoering|frisse blik|scan|afspraak|offerte)\b/i.test(text)||/bedrijfsgeheugen\.nl\/g\//i.test(text);
}

function personalViolations(text,body,hash){
  const out=[];
  const add=(code,message)=>out.push({code,message});
  const req=(ok,code,message)=>{if(!ok)add(code,message)};
  req(!!clean(body.content_id),'CONTENT_ID_REQUIRED','content_id ontbreekt.');
  req(/^\d{4}-\d{2}-\d{2}$/.test(clean(body.calendar_date)),'CALENDAR_DATE_REQUIRED','calendar_date ontbreekt of is ongeldig.');
  req(clean(body.channel_id||body.channel||body.buffer_channel_id)===PERSONAL_CHANNEL,'CHANNEL_ID_MISMATCH','Exact Arthur persoonlijk Buffer channel is verplicht.');
  req(body.channel_kind==='linkedin_personal','CHANNEL_KIND_MISMATCH','channel_kind moet linkedin_personal zijn.');
  req(body.identity_contract===PERSONAL_CONTRACT,'IDENTITY_CONTRACT_MISMATCH','arthur-personal-linkedin-identity-v4 is verplicht.');
  req(body.identity_gate_version===PARENT_CONTRACT,'IDENTITY_GATE_VERSION_MISMATCH','channel-identity-hard-gate-v3 is verplicht.');
  req(Array.isArray(body.source_lineage)?body.source_lineage.length>0:!!body.source_lineage,'SOURCE_LINEAGE_REQUIRED','Bron/evidence-lineage ontbreekt.');
  req(body.arthur_anchor_verified===true,'ARTHUR_ANCHOR_UNVERIFIED','Een geverifieerd Arthur-anker is verplicht.');
  req(body.first_person_claims_verified===true,'FIRST_PERSON_CLAIMS_UNVERIFIED','Eerste-persoonsclaims zijn niet aantoonbaar geverifieerd.');
  req(body.personal_life_topic===true,'PERSONAL_LIFE_TOPIC_REQUIRED','Persoonlijk onderwerp is niet bewezen.');
  req(body.corporate_voice===false,'CORPORATE_VOICE_BLOCKED','Corporate/consultantstem is geblokkeerd.');
  req(body.company_page_interchangeable===false,'COMPANY_PAGE_INTERCHANGEABLE_BLOCKED','Tekst mag niet uitwisselbaar zijn met de bedrijfspagina.');
  req(body.forced_business_moral===false,'FORCED_BUSINESS_MORAL_BLOCKED','Geforceerde businessmoraal is geblokkeerd.');
  req(body.prediction_lineage_present===true&&!!clean(body.prior_prediction_decision_id),'PREDICTION_LINEAGE_REQUIRED','Prediction/decision-lineage ontbreekt.');
  req(body.publication_intent==='publish','PUBLICATION_INTENT_REQUIRED','publication_intent=publish ontbreekt.');
  req(clean(body.final_text_hash)===hash,'FINAL_TEXT_HASH_MISMATCH','Final-text hash is niet exact gebonden aan de beoordeelde tekst.');
  const override=body.explicit_business_override===true&&clean(body.override_content_id)===clean(body.content_id);
  if(body.business_topic!==false&&!override)add('BUSINESS_TOPIC_DEFAULT_BLOCK','Zakelijk onderwerp is standaard geblokkeerd op Arthur persoonlijk.');
  if(body.sensitive_private_detail===true&&body.sensitive_private_approval!==true)add('SENSITIVE_PRIVATE_DETAIL_BLOCK','Privé/sensitief detail vereist exacte goedkeuring.');
  if(businessSignal(text)&&!override)add('FINAL_TEXT_BUSINESS_SIGNAL_BLOCK','De uiteindelijke tekst bevat zakelijke/Bedrijfsgeheugen-signalen en is niet toegestaan op Arthur persoonlijk.');
  if(/\b(de les (?:voor|hieruit)|wat dit (?:ons )?leert over|daarom (?:moet|heb je)|dit laat zien waarom).*(AI|bedrijf|management|digitalisering|data|bedrijfsproces)/i.test(text))add('FINAL_TEXT_FORCED_BUSINESS_MORAL','De tekst forceert een zakelijke les vanuit een persoonlijk verhaal.');
  return out;
}

function otherIdentityViolations(channel,text,body){
  const out=[];
  if(channel==='linkedin_company'&&/\bik (heb|had|was|ben|ging|kwam|zat|voelde|dacht)\b/i.test(text)&&!/\bArthur\b/i.test(text)){
    out.push({code:'COMPANY_CHANNEL_PERSONAL_DIARY_VOICE',message:'Bedrijfspagina mag niet ongemarkeerd als Arthurs dagboekstem publiceren.'});
  }
  if(channel==='instagram_company'){
    const mt=clean(body.media_type).toLowerCase();
    const src=clean(body.media_source).toLowerCase();
    const mediaUrl=clean(body.media_url);
    const gateAssetUrl=clean(body.mira_gate_asset_url);
    const gateEvidenceRef=clean(body.mira_gate_evidence_ref);
    const gateVerdict=clean(body.mira_gate_verdict).toUpperCase();
    const gateVerifiedAt=clean(body.mira_gate_verified_at);
    const gateVerifiedMs=Date.parse(gateVerifiedAt);

    if(body.mira_gate_passed!==true)out.push({code:'MIRA_GATE_NOT_PROVEN',message:'Mira hard gate ontbreekt.'});
    if(gateVerdict!=='PASS')out.push({code:'MIRA_GATE_VERDICT_REQUIRED',message:'Mira hard gate vereist een expliciete PASS-verdict.'});
    if(!mediaUrl)out.push({code:'INSTAGRAM_MEDIA_URL_REQUIRED',message:'Exacte finale Instagram media_url ontbreekt.'});
    if(!gateAssetUrl)out.push({code:'MIRA_GATE_ASSET_URL_REQUIRED',message:'Mira gate is niet aan een exacte finale asset gebonden.'});
    else if(mediaUrl&&clean(body.mira_gate_asset_url)===clean(body.media_url)===false)out.push({code:'MIRA_GATE_ASSET_MISMATCH',message:'Mira PASS hoort bij een andere asset dan de finale media.'});
    if(!gateEvidenceRef)out.push({code:'MIRA_GATE_EVIDENCE_REF_REQUIRED',message:'Mira gate evidence-ref ontbreekt.'});
    if(!gateVerifiedAt||!Number.isFinite(gateVerifiedMs))out.push({code:'MIRA_GATE_VERIFIED_AT_REQUIRED',message:'Mira gate verificatietijd ontbreekt of is ongeldig.'});
    else if(Date.now()-gateVerifiedMs>MIRA_PROOF_MAX_AGE||gateVerifiedMs-Date.now()>MIRA_CLOCK_SKEW)out.push({code:'MIRA_GATE_VERIFICATION_STALE',message:'Mira gate bewijs is te oud of ligt onaanvaardbaar in de toekomst.'});

    if(!clean(body.calendar_row_id))out.push({code:'MIRA_CALENDAR_ROW_REQUIRED',message:'Instagram kalenderregel ontbreekt.'});
    if((mt==='reel'||mt==='video')&&src!=='openart')out.push({code:'INSTAGRAM_VIDEO_SOURCE_INVALID',message:'Mira Reel/video moet OpenArt zijn.'});
    else if(['static','carousel','image'].includes(mt)&&src!=='placid')out.push({code:'INSTAGRAM_STATIC_SOURCE_INVALID',message:'Mira static/carousel moet Placid zijn.'});
    else if(!['reel','video','static','carousel','image'].includes(mt))out.push({code:'INSTAGRAM_MEDIA_TYPE_REQUIRED',message:'Instagram media_type ontbreekt.'});

    if((mt==='reel'||mt==='video')&&src==='openart'&&!clean(body.openart_history_id))out.push({code:'MIRA_OPENART_HISTORY_REQUIRED',message:'OpenArt finale video vereist exact history-id provenance.'});
    if(/\b(bij bedrijfsgeheugen op kantoor|ons kantoorprobleem|onze interne chaos|wij bij bedrijfsgeheugen lopen tegen)\b/i.test(text))out.push({code:'MIRA_INTERNAL_OFFICE_DYSFUNCTION',message:'Interne Bedrijfsgeheugen-kantoorproblemen zijn niet Mira.'});
    if(/\b(daarom heb je bedrijfsgeheugen nodig|de les voor ondernemers is|wat dit ons leert over digitalisering)\b/i.test(text))out.push({code:'MIRA_FORCED_BUSINESS_MORAL',message:'Mira-content mag geen geforceerde businessmoraal krijgen.'});
  }
  if(channel==='instagram_personal')out.push({code:'INSTAGRAM_PERSONAL_NOT_CONNECTED',message:'Persoonlijk Instagram is niet gekoppeld.'});
  return out;
}

Deno.serve(async req=>{
  if(req.method!=='POST')return json({ok:false,can_generate:false,can_publish:false,error:'METHOD_NOT_ALLOWED'},405);
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return json({ok:false,can_generate:false,can_publish:false,error:'SERVER_CONFIG'},503);
  let body={};
  try{body=await req.json()}catch{return json({ok:false,can_generate:false,can_publish:false,error:'INVALID_JSON'},400)}
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:contracts,error:ce}=await db.from('brain_records').select('record_id,status,verified,payload,result,updated_at').eq('tenant_id','canonical').in('record_id',[PARENT_CONTRACT,PERSONAL_CONTRACT]);
  if(ce)return json({ok:false,can_generate:false,can_publish:false,error:'CHANNEL_IDENTITY_CONTRACT_UNAVAILABLE'},503);
  const parent=(contracts||[]).find(x=>x.record_id===PARENT_CONTRACT),personal=(contracts||[]).find(x=>x.record_id===PERSONAL_CONTRACT);
  if(!parent||parent.status!=='VERIFIED'||parent.verified!==true||parent.result?.enforcement!=='FAIL_CLOSED'||!personal||personal.status!=='VERIFIED'||personal.verified!==true)return json({ok:false,can_generate:false,can_publish:false,error:'CHANNEL_IDENTITY_CONTRACT_UNAVAILABLE'},503);
  const raw=clean(body.channel||body.channel_id||body.buffer_channel_id).toLowerCase();
  const channel=CHANNEL_ALIASES[raw];
  if(!channel)return json({ok:false,can_generate:false,can_publish:false,error:'CHANNEL_REQUIRED_OR_UNKNOWN',contract_id:PARENT_CONTRACT},422);
  const {data,error}=await db.from('bg_schrijfregels').select('regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,bron,status,bijgewerkt_op').order('vertrouwen',{ascending:false}).limit(24);
  if(error)return json({ok:false,can_generate:false,can_publish:false,error:'RULE_CONTEXT_UNAVAILABLE'},503);
  const all=Array.isArray(data)?data:[],active=all.filter(r=>clean(r.status).toLowerCase()==='actief'&&clean(r.regel)&&clean(r.bijgewerkt_op));
  if(!active.length)return json({ok:false,can_generate:false,can_publish:false,error:'RULE_CONTEXT_EMPTY'},503);
  const times=active.map(r=>Date.parse(r.bijgewerkt_op)).filter(Number.isFinite);
  if(times.length!==active.length)return json({ok:false,can_generate:false,can_publish:false,error:'RULE_CONTEXT_INVALID'},503);
  const newest=Math.max(...times);
  if(Date.now()-newest>MAX_AGE)return json({ok:false,can_generate:false,can_publish:false,error:'RULE_CONTEXT_STALE'},503);
  const rules=active.slice(0,12).map(r=>({id:r.regel_id,topic:r.onderwerp,rule:r.regel,evidence:r.onderbouwing,evidence_count:r.bewijs_n,confidence:Number(r.vertrouwen||0),source:r.bron,updated_at:r.bijgewerkt_op}));
  const text=clean(body.post_text),hash=await digest(text),mode=clean(body.mode||'review').toLowerCase();
  if(mode==='preflight'||!text)return json({ok:true,can_generate:true,can_publish:false,identity_gate_decision:'BLOCKED_IDENTITY_GATE',channel,final_text_hash:hash,identity_gate_version:PARENT_CONTRACT,identity_contract:PERSONAL_CONTRACT});
  const identityBlockers=channel==='linkedin_personal'?personalViolations(text,body,hash):otherIdentityViolations(channel,text,body);
  let genericBlockers=[];
  if(channel!=='linkedin_personal'){
    const {data:violations,error:checkError}=await db.rpc('bg_brein_regels_check',{p_connectie_id:clean(body.connectie_id)||null,p_tekst:text,p_haaktype:clean(body.hook_type)||null});
    if(checkError)return json({ok:false,can_generate:false,can_publish:false,error:'RULE_CHECK_FAILED',channel},503);
    genericBlockers=(violations||[]).filter(v=>v.violation);
  }
  const blockers=[...identityBlockers,...genericBlockers];
  const pass=blockers.length===0;
  return json({ok:pass,can_generate:true,can_publish:pass,identity_gate_decision:pass?'PASS':'BLOCKED_IDENTITY_GATE',identity_gate_version:PARENT_CONTRACT,identity_contract:channel==='linkedin_personal'?PERSONAL_CONTRACT:PARENT_CONTRACT,channel,final_text_hash:hash,violations:blockers,rule_context:{source_updated_at:new Date(newest).toISOString(),positive_rules:rules,personal_override_policy:channel==='linkedin_personal'?'arthur-personal-v4-supersedes-conflicting-generic-business-rules':'generic-rules-apply'}},pass?200:422);
});
