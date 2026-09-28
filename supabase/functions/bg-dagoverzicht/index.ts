import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1';

// Dagoverzicht: commerciële acties + unified content operations from the same authenticated surface.
const TOKEN_HASH = 'aa992cf89d9eeea953e0af4c26b563466d625365af9e6f0fc32e227e6268a170';
const ORIGINS = /^https:\/\/(?:www\.)?bedrijfsgeheugen\.nl$|^https:\/\/(?:deploy-preview-\d+--|main--)?bedrijfsgeheugen\.netlify\.app$/i;

function clean(v: unknown){ return String(v??'').trim(); }
function latin(v: unknown){ return clean(v).replace(/[€]/g,'EUR ').replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/[^\x09\x0A\x0D\x20-\xFF]/g,''); }
function wrap(text:string,max=88){
  const out:string[]=[]; let line='';
  for(const word of latin(text).split(/\s+/).filter(Boolean)){
    const next=line?line+' '+word:word;
    if(next.length>max){ if(line)out.push(line); line=word; } else line=next;
  }
  if(line)out.push(line); return out;
}
async function createSalesPdf(action:any){
  const pdf=await PDFDocument.create();
  let current=pdf.addPage([595.28,841.89]);
  const font=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  let y=795;
  const draw=(text:string,size=10,isBold=false,indent=0)=>{
    for(const line of wrap(text,Math.max(36,88-Math.floor(indent/6)))){
      if(y<60){ current=pdf.addPage([595.28,841.89]); y=795; }
      current.drawText(line,{x:48+indent,y,size,font:isBold?bold:font,color:rgb(0.08,0.09,0.11)});
      y-=size+5;
    }
  };
  current.drawText('BEDRIJFSGEHEUGEN',{x:48,y,size:16,font:bold,color:rgb(0.15,0.26,0.84)}); y-=30;
  draw(clean(action.evidence?.give_asset||action.evidence?.commercial_intelligence?.recommended_asset||'Persoonlijke sales one-pager').replaceAll('_',' '),18,true); y-=4;
  draw('Voor: '+[action.person_name,action.company_name].filter(Boolean).join(' - '),11,true); y-=10;
  draw('Waarom nu',12,true);
  draw(action.reason||action.evidence?.latest_reason||'Evidence-backed commerciele aanleiding.'); y-=8;
  const headline=action.evidence?.trigger_evidence?.raw_evidence?.evidence?.headline||action.evidence?.headline||'';
  const summary=action.evidence?.trigger_evidence?.raw_evidence?.evidence?.summary||action.evidence?.summary||'';
  const source=action.evidence?.trigger_evidence?.raw_evidence?.evidence?.source_url||action.source_url||'';
  if(headline){draw('Signaal',12,true);draw(headline);}
  if(summary){y-=6;draw('Context',12,true);draw(summary);}
  if(source){y-=6;draw('Bron',12,true);draw(source);}
  y-=10;draw('Voorgestelde boodschap',12,true);draw(action.message_draft||'');
  y-=10;draw('Gebruik',12,true);draw('Deze one-pager is automatisch samengesteld door Powerhouse uit beschikbare evidence. Onbekende feiten zijn niet ingevuld. Controleer nieuwe informatie voordat je er conclusies aan verbindt.');
  y-=14;draw('Bedrijfsgeheugen.nl',9,true);
  return await pdf.save();
}
function bytesToBase64(bytes:Uint8Array){
  let binary=''; const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  return btoa(binary);
}

async function sha256(v: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const cors = {
    'access-control-allow-origin': ORIGINS.test(origin) ? origin : 'https://www.bedrijfsgeheugen.nl',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-bg-token',
    'vary': 'origin',
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex, nofollow',
  };
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method === 'GET') return json({ info: 'Het dagoverzicht staat op https://www.bedrijfsgeheugen.nl/intern/vandaag/' });
  if (req.method !== 'POST') return json({ error: 'ALLEEN_POST' }, 405);
  if (origin && !ORIGINS.test(origin)) return json({ error: 'HERKOMST' }, 403);
  if (await sha256(req.headers.get('x-bg-token') || '') !== TOKEN_HASH) return json({ error: 'GEEN_TOEGANG' }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'ONGELDIGE_JSON' }, 400); }

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'SERVER_CONFIG' }, 500);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  if (body?.actie === 'lijst') {
    const { data, error } = await client.from('bg_vandaag').select('*').limit(40);
    if (error) return json({ error: 'LEZEN_MISLUKT', detail: error.message.slice(0, 200) }, 500);
    return json({ items: data ?? [] });
  }

  if (body?.actie === 'content') {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const requestedDate = String(body?.datum || today);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) return json({ error: 'ONGELDIGE_DATUM' }, 400);

    const { data, error } = await client
      .from('content_operations_cockpit')
      .select('*')
      .eq('tenant_id', 'canonical')
      .eq('publication_date', requestedDate)
      .order('channel', { ascending: true });
    if (error) return json({ error: 'CONTENT_LEZEN_MISLUKT', detail: error.message.slice(0, 200) }, 500);

    const items = data ?? [];
    return json({
      datum: requestedDate,
      blog_komt: items.some((x: any) => x.channel === 'blog' && !['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)),
      compleet: items.length > 0 && items.every((x: any) => ['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)),
      overdue: items.filter((x: any) => x.is_overdue).length,
      items,
    });
  }

  if (body?.actie === 'pdf') {
    const actionId=String(body?.action_id||'');
    if(!actionId)return json({error:'ACTION_ID_VERPLICHT'},400);
    const {data:action,error}=await client.from('powerhouse_sales_actions')
      .select('action_id,person_name,company_name,role,message_draft,reason,source_url,evidence,status')
      .eq('action_id',actionId).maybeSingle();
    if(error||!action)return json({error:'ACTIE_NIET_GEVONDEN'},404);
    if(!['suggested','prepared'].includes(String(action.status)))return json({error:'ACTIE_NIET_ACTIEF'},409);
    try{
      const bytes=await createSalesPdf(action);
      const base=[action.company_name||action.person_name||'bedrijfsgeheugen','sales-one-pager']
        .map((x:any)=>latin(x).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))
        .filter(Boolean).join('-');
      return json({ok:true,filename:(base||'bedrijfsgeheugen-sales-one-pager')+'.pdf',mime_type:'application/pdf',base64:bytesToBase64(bytes)});
    }catch(e){return json({error:'PDF_MAKEN_MISLUKT',detail:String(e?.message||e).slice(0,200)},500);}
  }

  if (body?.actie === 'uitkomst') {
    const { data, error } = await client.rpc('bg_uitkomst_vastleggen', {
      p_fase: String(body?.fase || 'lead'), p_pagina: null, p_omzet_eur: Number(body?.omzet_eur ?? 0),
      p_bron: 'dagoverzicht', p_attributiesleutel: null, p_eigenaar: null, p_extra: {},
      p_action_id: String(body?.action_id || ''), p_uitkomstsoort: body?.uitkomstsoort ?? null,
    });
    if (error) return json({ error: 'MELDEN_MISLUKT', detail: error.message.slice(0, 200) }, 500);
    return json({ ok: true, resultaat: data });
  }

  return json({ error: 'ONBEKENDE_ACTIE' }, 400);
});
