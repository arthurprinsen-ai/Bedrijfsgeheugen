import postgres from 'npm:postgres@3.4.7';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SHARED_SECRET = Deno.env.get('POWERHOUSE_SHARED_SECRET') || Deno.env.get('POWERHOUSE_TOKEN') || '';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type,x-powerhouse-token,authorization',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};
const TERMINAL_GREEN = new Set(['LIVE_PROVEN','MEASURED','LEARNED','SKIPPED']);

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers }); }
function cleanDate(raw: string | null, fallback: string) {
  const value = (raw || fallback).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('INVALID_DATE');
  return value;
}
function todayAmsterdam() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const v = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${v.year}-${v.month}-${v.day}`;
}
async function schedulerToken() {
  try {
    const token = await rest('rpc/bg_geheim', { method: 'POST', body: { p_naam: 'powerhouse_daily_scheduler_token' } });
    const canonical = String(token ?? '').trim();
    if (canonical) return canonical;
  } catch (error) {
    console.error('CONTENT_OPERATIONS_CANONICAL_TOKEN_READ_FAILED', error instanceof Error ? error.message : String(error));
  }
  return SHARED_SECRET.trim();
}

async function authorized(req: Request) {
  const supplied = req.headers.get('x-powerhouse-token') || '';
  if (!supplied) return false;
  const expected = await schedulerToken();
  return expected.length > 0 && supplied === expected;
}

const DB_REF='adhjwmvyoixzjtmiroln';
const DB_POOLER_HOST='aws-0-eu-central-1.pooler.supabase.com';
const DIRECT_SELECTS=new Set(['content_operations_cockpit','content_publication_obligations','powerhouse_content_artifacts']);
const DIRECT_RPCS=new Set(['bg_geheim','sync_content_publication_obligations','powerhouse_reconcile_content_outcomes_v1','record_content_publication_state']);
function dbIdent(value:string){
  const m=value.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]||'';
  if(m!==value) throw new Error('DB_IDENTIFIER_REJECTED');
  return '"'+value.replaceAll('"','""')+'"';
}
function dbPoolerUrl(){
  const raw=Deno.env.get('SUPABASE_DB_URL')||'';
  if(!raw) throw new Error('SUPABASE_DB_URL_MISSING');
  const u=new URL(raw);
  u.hostname=DB_POOLER_HOST;
  u.port='6543';
  u.username='postgres.'+DB_REF;
  return u.toString();
}
const directSql=postgres(dbPoolerUrl(),{max:4,prepare:false,connect_timeout:6,idle_timeout:10,max_lifetime:60});
function scalarParam(value:any,values:any[],cast=''){
  values.push(value);
  return String.fromCharCode(36)+values.length+(cast?'::'+cast:'');
}
function rpcParam(value:any,values:any[]){
  return value!==null&&typeof value==='object'
    ? scalarParam(JSON.stringify(value),values,'jsonb')
    : scalarParam(value,values);
}
function selectList(raw:string){
  if(!raw||raw.trim()==='*') return '*';
  return raw.split(',').map(x=>dbIdent(x.trim())).join(',');
}
async function directRpc(name:string,body:any){
  if(!DIRECT_RPCS.has(name)) throw new Error('DB_RPC_REJECTED');
  const values:any[]=[];
  const call=Object.entries(body||{}).map(([k,v])=>dbIdent(k)+' := '+rpcParam(v,values)).join(',');
  const q='select to_jsonb(public.'+dbIdent(name)+'('+call+')) as result';
  const rows:any[]=await directSql.unsafe(q,values);
  return rows?.[0]?.result??null;
}
async function directSelect(path:string){
  const qmark=path.indexOf('?');
  const table=qmark>=0?path.slice(0,qmark):path;
  if(!DIRECT_SELECTS.has(table)) throw new Error('DB_TABLE_REJECTED');
  const params=new URLSearchParams(qmark>=0?path.slice(qmark+1):'');
  const values:any[]=[];
  const where:string[]=[];
  for(const [key,raw] of params.entries()){
    if(['select','order','limit'].includes(key)) continue;
    const col=dbIdent(key);
    if(raw.startsWith('eq.')) where.push(col+' = '+scalarParam(raw.slice(3),values));
    else if(raw.startsWith('gte.')) where.push(col+' >= '+scalarParam(raw.slice(4),values));
    else if(raw.startsWith('lte.')) where.push(col+' <= '+scalarParam(raw.slice(4),values));
    else if(raw.startsWith('in.(')&&raw.endsWith(')')){
      const items=raw.slice(4,-1).split(',').map(x=>x.trim()).filter(Boolean);
      where.push(items.length?col+' in ('+items.map(v=>scalarParam(v,values)).join(',')+')':'false');
    } else throw new Error('DB_FILTER_REJECTED');
  }
  let q='select '+selectList(params.get('select')||'*')+' from public.'+dbIdent(table);
  if(where.length) q+=' where '+where.join(' and ');
  const order=params.get('order');
  if(order){
    q+=' order by '+order.split(',').map(part=>{
      const [name,dir]=part.trim().split('.');
      return dbIdent(name)+(String(dir).toLowerCase()==='desc'?' desc':' asc');
    }).join(',');
  }
  const limit=Number(params.get('limit')||0);
  if(Number.isFinite(limit)&&limit>0) q+=' limit '+Math.trunc(limit);
  return await directSql.unsafe(q,values);
}
async function rest(path: string, options: { method?: string; body?: unknown } = {}) {
  const method=options.method||'GET';
  if(path.startsWith('rpc/')){
    if(method!=='POST') throw new Error('DB_RPC_METHOD_REJECTED');
    return await directRpc(path.slice(4),options.body||{});
  }
  if(method!=='GET') throw new Error('DB_TABLE_METHOD_REJECTED');
  return await directSelect(path);
}

async function getCockpit(req: Request) {
  const u = new URL(req.url);
  const today = todayAmsterdam();
  const from = cleanDate(u.searchParams.get('from'), today);
  const to = cleanDate(u.searchParams.get('to'), from);
  if (to < from) throw new Error('INVALID_DATE_RANGE');
  const channel = (u.searchParams.get('channel') || '').trim();
  const tenant = (u.searchParams.get('tenant') || 'canonical').trim();
  const filters = [`tenant_id=eq.${encodeURIComponent(tenant)}`, `publication_date=gte.${from}`, `publication_date=lte.${to}`];
  if (channel) filters.push(`channel=eq.${encodeURIComponent(channel)}`);
  const items = await rest(`content_operations_cockpit?${filters.join('&')}&select=*&order=publication_date.asc,channel.asc&limit=500`);
  const outcomeVerified = items.filter((x: any) => TERMINAL_GREEN.has(x.status)).length;
  const providerTruthVerified = items.filter((x: any) => x?.evidence?.provider_truth_verified === true).length;
  const dueOpen = items.filter((x: any) => (x.is_due_today || x.is_overdue) && !TERMINAL_GREEN.has(x.status)).length;
  const blocked = items.filter((x: any) => ['BLOCKED','FAILED'].includes(x.status)).length;
  const providerTruthUnverified = items.filter((x: any) => ['DISPATCHED','PUBLISHED'].includes(x.status) && ['linkedin_personal','linkedin_company','instagram'].includes(x.channel) && x?.evidence?.provider_truth_verified !== true).length;
  const health = blocked > 0 || providerTruthUnverified > 0 ? 'RED' : dueOpen > 0 ? 'AMBER' : 'GREEN';
  const summary = {
    total: items.length,
    due: items.filter((x: any) => x.is_due_today).length,
    overdue: items.filter((x: any) => x.is_overdue).length,
    liveProven: items.filter((x: any) => ['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)).length,
    outcomeVerified,
    providerTruthVerified,
    providerTruthUnverified,
    blocked,
    dueOpen,
    health,
    truthContract: 'GREEN MEANS OUTCOME VERIFIED',
    blogComing: items.some((x: any) => x.channel === 'blog' && !TERMINAL_GREEN.has(x.status)),
  };
  return { ok: health !== 'RED', from, to, tenant, channel: channel || null, summary, items };
}

async function deliveryContext(body: any) {
  const date = cleanDate(body?.date || null, todayAmsterdam());
  const tenant = String(body?.tenant || 'canonical').trim();
  await rest('rpc/sync_content_publication_obligations', { method: 'POST', body: { p_from: date, p_to: date } });
  await rest('rpc/powerhouse_reconcile_content_outcomes_v1', { method: 'POST', body: { p_date: date } });
  const channelFilter = 'in.(linkedin_personal,linkedin_company,instagram)';
  const obligations = await rest(`content_publication_obligations?tenant_id=eq.${encodeURIComponent(tenant)}&publication_date=eq.${date}&channel=${channelFilter}&select=*&order=channel.asc`);
  const artifactChannelFilter = 'in.(linkedin_personal,linkedin_company,instagram_company)';
  const artifacts = await rest(`powerhouse_content_artifacts?run_date=eq.${date}&channel=${artifactChannelFilter}&select=*&order=channel.asc`);
  const obligationByChannel = new Map((obligations || []).map((item: any) => [item.channel, item]));
  const enrichedArtifacts = (artifacts || []).map((artifact: any) => {
    const obligationChannel = artifact.channel === 'instagram_company' ? 'instagram' : artifact.channel;
    const obligation: any = obligationByChannel.get(obligationChannel) || null;
    return { ...artifact, delivery_readback: obligation ? { status: obligation.status || null, external_id: obligation.external_id || null, evidence: obligation.evidence || {}, provider_truth_verified: obligation.evidence?.provider_truth_verified === true, updated_at: obligation.updated_at || null } : null };
  });
  return { ok: true, date, tenant, obligations: obligations || [], artifacts: enrichedArtifacts };
}

async function recordDeliveryState(body: any) {
  const date = cleanDate(body?.date || null, todayAmsterdam());
  const channel = String(body?.channel || '').trim();
  const status = String(body?.status || '').trim();
  if (!['linkedin_personal','linkedin_company','instagram'].includes(channel)) throw new Error('INVALID_SOCIAL_CHANNEL');
  if (!status) throw new Error('STATUS_REQUIRED');
  if (['DISPATCHED','PUBLISHED'].includes(status) && body?.evidence?.provider_truth_verified !== true) throw new Error('PROVIDER_TRUTH_REQUIRED');
  const result = await rest('rpc/record_content_publication_state', { method: 'POST', body: {
    p_tenant_id: String(body?.tenant || 'canonical'), p_publication_date: date, p_channel: channel, p_status: status,
    p_content_id: body?.contentId || null, p_slug: null, p_external_id: body?.externalId || null, p_canonical_url: body?.canonicalUrl || null,
    p_evidence: body?.evidence || {}, p_metrics: body?.metrics || {}, p_next_action: body?.nextAction || null, p_error: body?.error || null,
  } });
  return { ok: true, item: Array.isArray(result) ? result[0] || null : result };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!(await authorized(req))) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
    if (req.method === 'GET') return json(await getCockpit(req));
    if (req.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
    let body: any = {};
    try { body = await req.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
    const action = String(body?.action || '').trim();
    if (action === 'delivery_context') return json(await deliveryContext(body));
    if (action === 'record_delivery_state') return json(await recordDeliveryState(body));
    return json({ ok: false, error: 'INVALID_ACTION' }, 400);
  } catch (e) {
    const internal = String((e as Error)?.message || e);
    console.error('CONTENT_OPERATIONS_ERROR', internal);
    const clientSafe = ['INVALID_DATE','INVALID_DATE_RANGE','INVALID_SOCIAL_CHANNEL','STATUS_REQUIRED','PROVIDER_TRUTH_REQUIRED'].includes(internal) ? internal : 'INTERNAL_ERROR';
    return json({ ok: false, error: clientSafe }, clientSafe === 'INTERNAL_ERROR' ? 500 : 400);
  }
});