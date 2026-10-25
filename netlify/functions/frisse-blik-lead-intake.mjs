// Voluntary Frisse Blik contact intake. Never derive consent from an anonymous scan.
const json=(data,status=200)=>new Response(JSON.stringify(data),{
  status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
});
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
const emailValid=s=>s.length<=200&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&!/[\r\n]/.test(s);
const keyValid=s=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const safeAttribution=x=>{
  const a=x&&typeof x==='object'&&!Array.isArray(x)?x:{};
  const field=(name,max=120)=>clean(a[name],max).replace(/[<>\r\n]/g,'');
  const session=field('session_id',100);
  return {
    session_id:/^[A-Za-z0-9._:-]{8,100}$/.test(session)?session:'',
    landing_source:field('landing_source',120),
    referrer_domain:field('referrer_domain',120),
    utm_source:field('utm_source',80),utm_medium:field('utm_medium',80),
    utm_campaign:field('utm_campaign',120),utm_content:field('utm_content',100)
  };
};
export default async function handler(req){
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  if(req.headers.get('origin')!==new URL(req.url).origin)return json({error:'ORIGIN_NOT_ALLOWED'},403);
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')||''))return json({error:'CONTENT_TYPE'},415);
  let raw;
  try{raw=await req.text();if(raw.length>6000)return json({error:'PAYLOAD_TOO_LARGE'},413);}
  catch{return json({error:'BAD_REQUEST'},400);}
  let b;try{b=JSON.parse(raw);}catch{return json({error:'INVALID_JSON'},400);}
  // Explicit consent for this exact follow-up; optional marketing is independent and defaults false.
  const key=clean(b?.idempotency_key,100);
  const name=clean(b?.contact_name,150);
  const company=clean(b?.company_name,180);
  const email=clean(b?.email,200).toLowerCase();
  const attr=safeAttribution(b?.attribution);
  if(clean(b?.website,500))return json({stored:false},200); // Honeypot: never store or count.
  if(!keyValid(key)||!name||!company||!emailValid(email)||b?.scan_followup_consent!==true
      ||typeof b?.marketing_consent!=='boolean')
    return json({error:'EXPLICIT_FOLLOWUP_CONSENT_REQUIRED'},422);
  const url=Netlify.env.get('BG_PORTAL_EU_SUPABASE_URL');
  const serviceKey=Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!serviceKey||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
    return json({error:'SERVER_UNAVAILABLE'},503);
  const receivedAt=new Date().toISOString();
  const score=Number(b.scan_score);
  const row={
    idempotency_key:'frisse-blik:'+key,source:'frisse_blik_voluntary_postscan',
    email,canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',
    attribution_root_key:attr.session_id||null,
    status:'new',
    metadata:{
      contact_name:name,company_name:company,relationship_id:clean(b.relationship_id,100)||null,
      purpose:'scan_followup_and_advice_booking',
      consent:{
        scan_followup:{granted:true,recorded_at:receivedAt,notice_version:'frisse_blik_scan_followup_v1',source_path:'/frisse-blik'},
        marketing_email:{granted:b.marketing_consent===true,recorded_at:receivedAt,notice_version:'frisse_blik_optional_marketing_v1'}
      },
      attribution:attr,
      scan:{type:'frisse_blik',score:Number.isInteger(score)&&score>=0&&score<=100?score:null},
      booking:{status:'NOT_PROVIDER_VERIFIED'}
    }
  };
  const base=url+'/rest/v1/commercial_leads';
  const headers={'apikey':serviceKey,Authorization:'Bearer '+serviceKey,'Content-Type':'application/json'};
  let inserted;
  try{
    inserted=await fetch(base+'?on_conflict=idempotency_key',{
      method:'POST',headers:{...headers,Prefer:'resolution=ignore-duplicates,return=representation'},
      body:JSON.stringify(row),signal:AbortSignal.timeout(8000)
    });
    if(!inserted.ok)return json({error:'LEAD_STORE_UNAVAILABLE'},502);
  }catch{return json({error:'LEAD_STORE_UNAVAILABLE'},502);}
  // Independent database readback; a successful network response alone is not a lead.
  let stored;
  try{
    const read=await fetch(base+'?idempotency_key=eq.'+encodeURIComponent(row.idempotency_key)
      +'&select=lead_id,email,source,attribution_root_key,metadata',{
      headers:{...headers,Accept:'application/json'},signal:AbortSignal.timeout(8000)
    });
    if(!read.ok)return json({error:'LEAD_READBACK_UNAVAILABLE'},502);
    const rows=await read.json();
    stored=Array.isArray(rows)?rows[0]:null;
  }catch{return json({error:'LEAD_READBACK_UNAVAILABLE'},502);}
  if(!stored||stored.email!==email||stored.source!==row.source
      ||stored.metadata?.consent?.scan_followup?.granted!==true
      ||stored.metadata?.consent?.marketing_email?.granted!==(b.marketing_consent===true))
    return json({error:'LEAD_RECEIPT_MISMATCH'},409);
  return json({stored:true,lead_id:stored.lead_id,attribution_root_key:stored.attribution_root_key||null},201);
}
export const config={
  path:'/.netlify/functions/frisse-blik-lead-intake',
  method:['POST'],
  rateLimit:{action:'rate_limit',aggregateBy:'ip',windowSize:60,windowLimit:8}
};