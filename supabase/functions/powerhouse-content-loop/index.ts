import postgres from 'npm:postgres@3.4.7';


const DB_REF='adhjwmvyoixzjtmiroln';
const DB_POOLER_HOST='aws-0-eu-central-1.pooler.supabase.com';
const DIRECT_TABLES=new Set(["content_publication_obligations","powerhouse_channel_decisions","brain_records"]);
const DIRECT_RPCS=new Set(["bg_geheim","powerhouse_reconcile_content_outcomes_v1","powerhouse_select_instagram_daily_winner_v1","powerhouse_ensure_instagram_media_job_v1"]);
const DB_JSON_COLUMNS=new Set(['bg_gezondheid.gegevens','brain_records.result','brain_records.provenance','brain_records.payload','content_publication_obligations.evidence','content_publication_obligations.metrics','powerhouse_channel_decisions.delivery_evidence','powerhouse_channel_decisions.learning_evidence','powerhouse_content_artifacts.generation_evidence','powerhouse_content_recommendations.evidence','powerhouse_daily_runs.evidence','powerhouse_instagram_daily_winners_v1.selector_evidence','powerhouse_instagram_daily_winners_v1.outcome_evidence','powerhouse_instagram_media_jobs_v1.asset_manifest','powerhouse_instagram_media_jobs_v1.proof_manifest','powerhouse_media_proof_evidence_v1.proof_lineage','powerhouse_sales_actions.evidence']);
const DB_ARRAY_CASTS=new Map([['powerhouse_channel_decisions.source_recommendation_ids','uuid[]'],['powerhouse_instagram_media_jobs_v1.allowed_providers','text[]'],['brain_records.predecessor_ids','text[]'],['brain_records.evidence_ids','text[]'],['brain_ai_governance_registry.data_categories','text[]'],['brain_ai_governance_registry.prohibited_data_categories','text[]'],['brain_ai_governance_registry.approval_evidence_ids','text[]'],['brain_ai_governance_registry.evidence_ids','text[]'],['brain_ai_governance_registry.subprocessors','text[]'],['brain_ai_governance_registry.provider_evidence_urls','text[]']]);
const DB_DEFAULT_CONFLICT=new Map([['powerhouse_channel_decisions','run_date,channel'],['brain_records','tenant_id,record_id'],['content_publication_obligations','tenant_id,publication_date,channel'],['powerhouse_content_artifacts','run_date,channel'],['powerhouse_daily_runs','run_date'],['powerhouse_instagram_daily_winners_v1','run_date'],['bg_campaign_links','key'],['powerhouse_instagram_media_jobs_v1','tenant_id,publication_date,channel'],['powerhouse_media_proof_evidence_v1','fingerprint']]);
function dbIdent(value:string){const m=value.match(/^[A-Za-z_][A-Za-z0-9_]*/)?.[0]||'';if(m!==value)throw new Error('DB_IDENTIFIER_REJECTED');return '"'+value.replaceAll('"','""')+'"';}
function dbPoolerUrl(){const raw=Deno.env.get('SUPABASE_DB_URL')||'';if(!raw)throw new Error('SUPABASE_DB_URL_MISSING');const u=new URL(raw);u.hostname=DB_POOLER_HOST;u.port='6543';u.username='postgres.'+DB_REF;return u.toString();}
const directSql=postgres(dbPoolerUrl(),{max:2,prepare:false,connect_timeout:6,idle_timeout:10,max_lifetime:45});
function scalarParam(value:any,values:any[],cast=''){values.push(value);return String.fromCharCode(36)+values.length+(cast?'::'+cast:'');}
function normalizeJsonValue(value:any){
 let current=value;
 for(let i=0;i<3&&typeof current==='string';i++){
   const raw=current.trim();
   if(!raw)return current;
   try{current=JSON.parse(raw);}catch{return current;}
 }
 return current;
}
function normalizeRowJson(table:string,row:any){
 if(!row||typeof row!=='object'||Array.isArray(row))return row;
 const prefix=table+'.';
 for(const key of DB_JSON_COLUMNS){
   if(!key.startsWith(prefix))continue;
   const column=key.slice(prefix.length);
   if(Object.prototype.hasOwnProperty.call(row,column))row[column]=normalizeJsonValue(row[column]);
 }
 return row;
}

function valueExpr(table:string,column:string,value:any,values:any[]){const key=table+'.'+column;if(DB_JSON_COLUMNS.has(key)) return scalarParam(JSON.stringify(normalizeJsonValue(value)??null),values,'jsonb');const arrCast=DB_ARRAY_CASTS.get(key);if(arrCast&&Array.isArray(value)){if(!value.length)return 'ARRAY[]::'+arrCast;return 'ARRAY['+value.map(v=>scalarParam(v,values)).join(',')+']::'+arrCast;}return scalarParam(value,values);}
function rpcExpr(value:any,values:any[]){return value!==null&&typeof value==='object'?scalarParam(JSON.stringify(value),values,'jsonb'):scalarParam(value,values);}
class DirectQuery{
 table:string;op='select';columns='*';payload:any=null;returning='';filters:any[]=[];orders:any[]=[];limitValue:number|null=null;singleMode='';conflict='';ignoreDuplicates=false;
 constructor(table:string){if(!DIRECT_TABLES.has(table))throw new Error('DB_TABLE_REJECTED:'+table);this.table=table;}
 select(columns='*'){if(['update','upsert','insert'].includes(this.op))this.returning=columns;else{this.op='select';this.columns=columns;}return this;}
 insert(payload:any){this.op='insert';this.payload=payload;return this;} update(payload:any){this.op='update';this.payload=payload||{};return this;}
 upsert(payload:any,options:any={}){this.op='upsert';this.payload=payload||{};this.conflict=String(options?.onConflict||DB_DEFAULT_CONFLICT.get(this.table)||'');this.ignoreDuplicates=options?.ignoreDuplicates===true;return this;}
 eq(column:string,value:any){this.filters.push({kind:'eq',column,value});return this;} in(column:string,values:any[]){this.filters.push({kind:'in',column,values:Array.isArray(values)?values:[]});return this;}
 not(column:string,operator:string,value:any){this.filters.push({kind:'not',column,operator,value});return this;} order(column:string,options:any={}){this.orders.push({column,ascending:options?.ascending!==false});return this;}
 limit(value:number){this.limitValue=Number(value);return this;} maybeSingle(){this.singleMode='maybe';return this.execute();} single(){this.singleMode='single';return this.execute();} then(resolve:any,reject:any){return this.execute().then(resolve,reject);}
 where(values:any[]){const parts:string[]=[];for(const f of this.filters){const col=dbIdent(f.column);if(f.kind==='eq')parts.push(f.value===null?col+' is null':col+' = '+scalarParam(f.value,values));else if(f.kind==='in'){if(!f.values.length){parts.push('false');continue;}parts.push(col+' in ('+f.values.map((v:any)=>scalarParam(v,values)).join(',')+')');}else if(f.kind==='not'&&f.operator==='is'&&f.value===null)parts.push(col+' is not null');else throw new Error('DB_FILTER_REJECTED');}return parts.length?' where '+parts.join(' and '):'';}
 selectList(raw:string){if(raw.trim()==='*')return '*';return raw.split(',').map(x=>dbIdent(x.trim())).join(',');}
 async execute(){try{const values:any[]=[];let q='';if(this.op==='select'){q='select '+this.selectList(this.columns)+' from public.'+dbIdent(this.table)+this.where(values);if(this.orders.length)q+=' order by '+this.orders.map(o=>dbIdent(o.column)+(o.ascending?' asc':' desc')).join(',');if(Number.isFinite(this.limitValue as number))q+=' limit '+Math.max(0,Math.trunc(this.limitValue as number));}
 else if(this.op==='insert'){const items=Array.isArray(this.payload)?this.payload:[this.payload];if(!items.length||!items[0])throw new Error('DB_EMPTY_INSERT');const cols=Object.keys(items[0]);q='insert into public.'+dbIdent(this.table)+' ('+cols.map(dbIdent).join(',')+') values '+items.map((item:any)=>'('+cols.map(c=>valueExpr(this.table,c,item[c],values)).join(',')+')').join(',');if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else if(this.op==='update'){const entries=Object.entries(this.payload||{});if(!entries.length)throw new Error('DB_EMPTY_UPDATE');q='update public.'+dbIdent(this.table)+' set '+entries.map(([k,v])=>dbIdent(k)+' = '+valueExpr(this.table,k,v,values)).join(',')+this.where(values);if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else if(this.op==='upsert'){const entries=Object.entries(this.payload||{});if(!entries.length)throw new Error('DB_EMPTY_UPSERT');const cols=entries.map(([k])=>dbIdent(k));const vals=entries.map(([k,v])=>valueExpr(this.table,k,v,values));q='insert into public.'+dbIdent(this.table)+' ('+cols.join(',')+') values ('+vals.join(',')+')';const conflict=this.conflict.split(',').map(x=>x.trim()).filter(Boolean);if(!conflict.length)throw new Error('DB_UPSERT_CONFLICT_REQUIRED');q+=' on conflict ('+conflict.map(dbIdent).join(',')+') ';if(this.ignoreDuplicates)q+='do nothing';else{const set=new Set(conflict);const ups=entries.map(([k])=>k).filter(k=>!set.has(k));q+=ups.length?'do update set '+ups.map(k=>dbIdent(k)+' = excluded.'+dbIdent(k)).join(','):'do nothing';}if(this.returning)q+=' returning '+this.selectList(this.returning);}
 else throw new Error('DB_OPERATION_REJECTED');const rows:any[]=await directSql.unsafe(q,values);const normalized=rows.map((row:any)=>normalizeRowJson(this.table,row));let data:any;if(['insert','update','upsert'].includes(this.op)&&!this.returning)data=null;else if(this.singleMode)data=normalized[0]||null;else data=normalized;return {data,error:null};}catch(error){return {data:null,error:{message:error instanceof Error?error.message:String(error)}};}}
}
async function directRpc(name:string,args:Record<string,any>={}){try{if(!DIRECT_RPCS.has(name))throw new Error('DB_RPC_REJECTED:'+name);const values:any[]=[];const call=Object.entries(args||{}).map(([k,v])=>dbIdent(k)+' := '+rpcExpr(v,values)).join(',');const q='select to_jsonb(public.'+dbIdent(name)+'('+call+')) as result';const rows:any[]=await directSql.unsafe(q,values);return {data:normalizeJsonValue(rows?.[0]?.result??null),error:null};}catch(error){return {data:null,error:{message:error instanceof Error?error.message:String(error)}};}}
function createDirectDb(){return {from:(table:string)=>new DirectQuery(table),rpc:(name:string,args:any={})=>directRpc(name,args)};}

const clean = (v: unknown) => String(v ?? '').trim();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const OPERATIONAL_CHANNELS = ['linkedin_personal','linkedin_company','instagram','blog'];
const TERMINAL_GREEN = new Set(['LIVE_PROVEN','MEASURED','LEARNED','SKIPPED']);
const LOOP_LEASE_MS = 240_000;
const CHILD_TIMEOUTS: Record<string, number> = {
  'powerhouse-instagram-media-router': 10_000,
  'powerhouse-composio-linkedin-setup': 8_000,
  'powerhouse-social-publisher:audit': 12_000,
  'powerhouse-content-orchestrator': 40_000,
  'powerhouse-social-publisher': 25_000,
  'powerhouse-blog-queue': 25_000,
};
function providerSideEffectTerminal(o:any){
  const channel=clean(o?.channel);
  if(!['linkedin_personal','linkedin_company','instagram'].includes(channel))return false;
  const evidence=o?.evidence||{};
  const ref=clean(o?.external_id);
  if(!ref)return false;
  return evidence?.provider_publication_ack_verified===true
    || evidence?.provider_create_success===true
    || (evidence?.provider_truth_verified===true && ['published','sent','live'].includes(clean(evidence?.provider_status).toLowerCase()));
}
function obligationTerminal(o:any){
  return TERMINAL_GREEN.has(clean(o?.status))
    || (clean(o?.status)==='PUBLISHED' && providerSideEffectTerminal(o));
}

async function readBoundedJson(response: Response, maxBytes = 32768) {
  const reader = response.body?.getReader();
  if (!reader) return { body: {}, truncated: false, bytes: 0 };
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.length) continue;
      const remaining = maxBytes - total;
      if (remaining <= 0) { truncated = true; break; }
      const take = value.length > remaining ? value.subarray(0, remaining) : value;
      chunks.push(take);
      total += take.length;
      if (value.length > remaining || total >= maxBytes) { truncated = true; break; }
    }
  } finally {
    if (truncated) {
      try { await reader.cancel(); } catch {}
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  const text = new TextDecoder().decode(merged);
  let body:any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { parse_error:true, preview:text.slice(0,512) }; }
  return { body, truncated, bytes: total };
}

async function invoke(base: string, token: string, name: string, payload: any) {
  const audit = payload?.mode === 'audit_only';
  const timeoutKey = audit && name === 'powerhouse-social-publisher' ? 'powerhouse-social-publisher:audit' : name;
  const timeoutMs = CHILD_TIMEOUTS[timeoutKey] || 20_000;
  try {
    const response = await fetch(`${base}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-powerhouse-token': token },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const bounded = await readBoundedJson(response);
    return {
      name,
      http: response.status,
      ok: response.ok && bounded.body?.ok !== false,
      body: bounded.body,
      body_bytes: bounded.bytes,
      body_truncated: bounded.truncated,
      timeout_ms: timeoutMs
    };
  } catch (error) {
    const detail = clean((error as Error)?.name || (error as Error)?.message || error).slice(0,80);
    return { name, http: 0, ok: false, timed_out: detail.toLowerCase().includes('timeout'), error: 'CHILD_CALL_FAILED', detail, timeout_ms: timeoutMs };
  }
}

async function claimLoopLease(runDate:string, holder:string) {
  const recordId = `runtime-lease:content-closed-loop:${runDate}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + LOOP_LEASE_MS).toISOString();
  const rows:any[] = await directSql.unsafe(
    `insert into public.brain_records(
       tenant_id,record_id,record_type,record_kind,subject_id,status,observed_at,executed,verified,
       result,payload,idempotency_key,source_revision,stored_at,updated_at
     ) values (
       $1,$2,'Verification','verification',$3::text,'IN_PROGRESS',$4::timestamptz,true,false,
       '{}'::jsonb,
       jsonb_build_object(
         'holder',$5::text,
          'run_date',$3::text,
          'expires_at',$6::timestamptz,
         'lease','content-closed-loop-v1'
       ),
       $2,'content-closed-loop-lease-v1',$4,$4
     )
     on conflict (tenant_id,record_id) do update set
       status='IN_PROGRESS',
       observed_at=excluded.observed_at,
       executed=true,
       verified=false,
       payload=excluded.payload,
       source_revision=excluded.source_revision,
       updated_at=excluded.updated_at
     where coalesce(
             case when jsonb_typeof(public.brain_records.payload)='object'
                  then (public.brain_records.payload->>'expires_at')::timestamptz
                  else null end,
             'epoch'::timestamptz
           ) <= now()
        or (
             jsonb_typeof(public.brain_records.payload)='object'
             and public.brain_records.payload->>'holder' = $5::text
           )
     returning record_id`,
    ['canonical',recordId,runDate,now,holder,expiresAt]
  );
  return rows.length === 1;
}

async function releaseLoopLease(runDate:string, holder:string) {
  const recordId = `runtime-lease:content-closed-loop:${runDate}`;
  const now = new Date().toISOString();
  await directSql.unsafe(
    `update public.brain_records
       set status='VERIFIED',
           verified=true,
           observed_at=$1::timestamptz,
           payload=jsonb_build_object(
             'holder',$2,
             'run_date',$3,
             'expires_at',$1,
             'released_at',$1,
             'lease','content-closed-loop-v1'
           ),
           updated_at=$1
     where tenant_id='canonical'
       and record_id=$4::text
       and jsonb_typeof(payload)='object'
       and payload->>'holder'=$2::text`,
    [now,holder,runDate,recordId]
  );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'POST_ONLY' }, 405);
  const url = Deno.env.get('SUPABASE_URL') || '';
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !service) return json({ ok: false, error: 'CONFIG' }, 500);
  const db=createDirectDb();
  const authSecret = await db.rpc('bg_geheim', { p_naam: 'powerhouse_daily_scheduler_token' });
  if (authSecret.error) {
    console.error('CONTENT_LOOP_AUTH_LOOKUP_FAILED');
    return json({ ok: false, error: 'AUTH_SECRET_LOOKUP_FAILED' }, 503);
  }
  const expected = clean(authSecret.data);
  if (!expected) {
    console.error('CONTENT_LOOP_AUTH_SECRET_EMPTY');
    return json({ ok: false, error: 'AUTH_SECRET_EMPTY' }, 503);
  }
  const provided = clean(req.headers.get('x-powerhouse-token'));
  if (!provided) return json({ ok: false, error: 'TOKEN_REQUIRED', expected_len: expected.length, provided_len: 0 }, 401);
  if (provided !== expected) {
    const authShape = { expected_len: expected.length, provided_len: provided.length, same_length: provided.length === expected.length };
    console.error('CONTENT_LOOP_TOKEN_MISMATCH_SHAPE', JSON.stringify(authShape));
    return json({ ok: false, error: 'TOKEN_MISMATCH', ...authShape }, 401);
  }
  let input: any = {};
  try { input = await req.json(); } catch { /* default */ }
  const runDate = clean(input.runDate) || localDate();
  const leaseHolder = crypto.randomUUID();
  let leaseAcquired = false;
  try {
    leaseAcquired = await claimLoopLease(runDate, leaseHolder);
  } catch (error) {
    console.error('CONTENT_LOOP_LEASE_CLAIM_FAILED', clean((error as Error)?.message || error).slice(0,160));
    return json({ ok:false, runDate, error:'LEASE_CLAIM_FAILED' }, 503);
  }
  if (!leaseAcquired) return json({ ok:true, runDate, skipped:true, reason:'ALREADY_RUNNING' }, 202);

  const stepResults: any[] = [];

  try {
    const first = await db.rpc('powerhouse_reconcile_content_outcomes_v1', { p_date: runDate });
    if (first.error) throw new Error('RECONCILE_PRE_FAILED');
    stepResults.push({ name: 'reconcile_pre', ok: true });

    // Freeze one ex-ante Mira winner before any media generation or publication work.
    const winner = await db.rpc('powerhouse_select_instagram_daily_winner_v1', { p_date: runDate });
    if (winner.error) throw new Error('INSTAGRAM_DAILY_WINNER_SELECTION_FAILED');
    stepResults.push({ name: 'instagram_daily_winner', ok: winner.data?.selected === true, selected: winner.data?.selected === true, recommendation_id: clean(winner.data?.recommendation_id), format: clean(winner.data?.format), reason: clean(winner.data?.reason) });
    // Channel isolation: Instagram readiness may degrade Instagram, but must never block
    // blog/LinkedIn generation and delivery. Blog has its own no-gap obligation.
    if (winner.data?.selected !== true) {
      stepResults.push({ name: 'instagram_daily_winner_gate', ok: false, degraded: true, error: 'INSTAGRAM_DAILY_WINNER_REQUIRED' });
    }
    const mediaJob = await db.rpc('powerhouse_ensure_instagram_media_job_v1', { p_date: runDate });
    if (mediaJob.error || mediaJob.data?.ok !== true) {
      stepResults.push({ name: 'instagram_winner_media_job', ok: false, degraded: true, error: 'INSTAGRAM_WINNER_MEDIA_JOB_FAILED', status: clean(mediaJob.data?.status), next_action: clean(mediaJob.data?.next_action) });
    } else {
      stepResults.push({ name: 'instagram_winner_media_job', ok: true, status: clean(mediaJob.data?.status), job_id: clean(mediaJob.data?.job_id) });
    }

    // Media routing is isolated: a missing/blocked Instagram asset never blocks LinkedIn or blog.
    if (winner.data?.selected === true && mediaJob.data?.ok === true) {
      stepResults.push(await invoke(url, expected, 'powerhouse-instagram-media-router', { runDate }));
    } else {
      stepResults.push({ name:'powerhouse-instagram-media-router', ok:true, skipped:true, degraded:true, reason:'INSTAGRAM_NOT_READY' });
    }

    // Read-only provider truth before any content decision mutation.
    stepResults.push(await invoke(url, expected, 'powerhouse-composio-linkedin-setup', { action: 'status', runDate }));
    stepResults.push(await invoke(url, expected, 'powerhouse-social-publisher', { runDate, mode: 'audit_only' }));

    // Bounded generation: only invoke the heavyweight orchestrator when a publish claim
    // still needs an artifact. Existing content_ready claims go straight to delivery.
    const { data: pendingGeneration, error: pendingGenerationError } = await db
      .from('powerhouse_channel_decisions')
      .select('channel')
      .eq('run_date', runDate)
      .eq('decision', 'publish')
      .eq('state', 'decided')
      .limit(1);
    if (pendingGenerationError) throw new Error('PENDING_GENERATION_READ_FAILED');
    if (Array.isArray(pendingGeneration) && pendingGeneration.length > 0) {
      stepResults.push(await invoke(url, expected, 'powerhouse-content-orchestrator', { runDate }));
    } else {
      stepResults.push({ name:'powerhouse-content-orchestrator', ok:true, skipped:true, reason:'NO_PENDING_ARTIFACT' });
    }

    // Independent delivery lanes execute in parallel, once per tick.
    const [socialDispatch, blogDispatch] = await Promise.all([
      invoke(url, expected, 'powerhouse-social-publisher', { runDate, mode: 'publish_only' }),
      invoke(url, expected, 'powerhouse-blog-queue', { runDate }),
    ]);
    stepResults.push(socialDispatch, blogDispatch);

    // Commercial engagement is a separate non-publication lane: preserve cockpit automation
    // without putting Composio comment execution back onto the publication critical path.
    stepResults.push(await invoke(url, expected, 'powerhouse-social-publisher', { runDate, mode: 'cockpit_autopilot' }));

    // Buffer is legacy telemetry only and is deliberately absent from the critical path.
    stepResults.push({ name:'bg-buffer-sync', ok:true, skipped:true, non_blocking:true, linkedin_authority:'composio', reason:'LEGACY_TELEMETRY_OUTSIDE_CRITICAL_PATH' });

    const final = await db.rpc('powerhouse_reconcile_content_outcomes_v1', { p_date: runDate });
    if (final.error) throw new Error('RECONCILE_POST_FAILED');
    stepResults.push({ name: 'reconcile_post', ok: true });

    const [{ data: obligations, error: obligationsError }, { data: decisions, error: decisionsError }] = await Promise.all([
      db.from('content_publication_obligations').select('channel,status,external_id,evidence,last_error,next_action,updated_at').eq('tenant_id', 'canonical').eq('publication_date', runDate).in('channel', OPERATIONAL_CHANNELS),
      db.from('powerhouse_channel_decisions').select('channel,decision,state,delivery_ref,delivery_evidence,updated_at').eq('run_date', runDate),
    ]);
    if (obligationsError) throw new Error('OBLIGATIONS_READ_FAILED');
    if (decisionsError) throw new Error('DECISIONS_READ_FAILED');

    const outcomeVerified = (obligations || []).filter((o: any) => obligationTerminal(o)).length;
    const providerTruthVerified = (obligations || []).filter((o: any) => o.evidence?.provider_truth_verified === true).length;
    const blocked = (obligations || []).filter((o: any) => ['BLOCKED','FAILED'].includes(clean(o.status)) && !providerSideEffectTerminal(o)).length;
    const hardBoundaries = (decisions || []).filter((d: any) =>
      d.delivery_evidence?.capability_state === 'BLOCKED_HARD_BOUNDARY'
      && !(d.delivery_evidence?.provider_create_success===true && !!clean(d.delivery_ref))
      && !(d.delivery_evidence?.provider_publication_ack_verified===true && !!clean(d.delivery_ref))
      && !(d.delivery_evidence?.provider_truth_verified===true && !!clean(d.delivery_ref))
    ).map((d: any) => ({ channel: d.channel, reason: d.delivery_evidence?.capability_reason || d.rationale }));
    const allOperationalGreen = (obligations || []).length === OPERATIONAL_CHANNELS.length && (obligations || []).every((o: any) => obligationTerminal(o));
    const loopState = blocked > 0 ? 'RED' : allOperationalGreen ? 'GREEN' : 'AMBER';
    const providerTruthHealthy = (obligations || []).every((o: any) => {
      if (['DISPATCHED','PUBLISHED'].includes(clean(o.status)) && ['linkedin_personal','linkedin_company','instagram'].includes(clean(o.channel))) {
        return o.evidence?.provider_truth_verified === true || providerSideEffectTerminal(o);
      }
      return true;
    });

    const obligationSummary = (obligations || []).map((o:any) => ({
      channel: clean(o.channel),
      status: clean(o.status),
      external_id: clean(o.external_id) || null,
      last_error: clean(o.last_error) || null,
      next_action: clean(o.next_action) || null,
      provider_truth_verified: o.evidence?.provider_truth_verified === true,
      provider_status: clean(o.evidence?.provider_status) || null,
      updated_at: o.updated_at,
    }));
    const decisionSummary = (decisions || []).map((d:any) => ({
      channel: clean(d.channel),
      decision: clean(d.decision),
      state: clean(d.state),
      delivery_ref: clean(d.delivery_ref) || null,
      capability_state: clean(d.delivery_evidence?.capability_state) || null,
      capability_reason: clean(d.delivery_evidence?.capability_reason) || null,
      updated_at: d.updated_at,
    }));
    const result = {
      ok: loopState !== 'RED' && providerTruthHealthy,
      loop_state: loopState,
      runDate,
      truth_contract: 'GREEN MEANS PROVIDER SIDE-EFFECT OR OUTCOME VERIFIED',
      outcomeVerified,
      providerTruthVerified,
      providerTruthHealthy,
      blocked,
      hardBoundaries,
      obligations: obligationSummary,
      decisions: decisionSummary,
      steps: stepResults.map((s:any)=>({
        name:s.name, ok:s.ok, http:s.http ?? null, timed_out:s.timed_out===true,
        degraded:s.degraded===true, skipped:s.skipped===true, body_bytes:s.body_bytes ?? null,
        body_truncated:s.body_truncated===true, error:s.error ?? null
      })),
    };

    await db.from('brain_records').upsert({
      tenant_id: 'canonical', record_id: `content-closed-loop:${runDate}`, record_type: 'Verification', record_kind: 'verification', subject_id: runDate,
      status: loopState === 'GREEN' ? 'VERIFIED' : loopState === 'RED' ? 'BLOCKED' : 'IN_PROGRESS', observed_at: new Date().toISOString(), executed: true,
      verified: loopState === 'GREEN', result, payload: { run_date: runDate, supervisor: 'powerhouse-content-loop-v1' }, idempotency_key: `content-closed-loop:${runDate}`,
      source_revision: 'powerhouse-content-loop-v1', stored_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,record_id' });

    return json(result, result.ok ? 200 : 409);
  } catch (error) {
    const message = String((error as Error)?.message || error).slice(0, 500);
    console.error('CONTENT_LOOP_ERROR', message, stepResults);
    try {
      await db.from('brain_records').upsert({
        tenant_id: 'canonical', record_id: `content-closed-loop:${runDate}`, record_type: 'Verification', record_kind: 'verification', subject_id: runDate,
        status: 'BLOCKED', observed_at: new Date().toISOString(), executed: true, verified: false,
        result: { loop_state: 'RED', error: 'CONTENT_LOOP_INTERNAL_ERROR', truth_contract: 'GREEN MEANS PROVIDER SIDE-EFFECT OR OUTCOME VERIFIED' },
        payload: { run_date: runDate, supervisor: 'powerhouse-content-loop-v1' }, idempotency_key: `content-closed-loop:${runDate}`, source_revision: 'powerhouse-content-loop-v1', stored_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, { onConflict: 'tenant_id,record_id' });
    } catch { /* preserve original failure */ }
    return json({ ok: false, loop_state: 'RED', runDate, error: 'CONTENT_LOOP_INTERNAL_ERROR' }, 500);
  } finally {
    const childMayStillRun = stepResults.some((s:any) => s?.timed_out === true || s?.http === 0);
    if (childMayStillRun) {
      console.error('CONTENT_LOOP_LEASE_RETAINED_UNTIL_EXPIRY');
    } else {
      try { await releaseLoopLease(runDate, leaseHolder); } catch (error) {
        console.error('CONTENT_LOOP_LEASE_RELEASE_FAILED', clean((error as Error)?.message || error).slice(0,160));
      }
    }
  }
});
