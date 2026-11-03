// ONE BRAIN existing 15-loop assurance projection: read-only, admin-only by its Netlify caller.
// The *original* Supabase assurance view remains the sole authority; this module adds
// no scheduler, writer, retry or synthetic status. Unknown/partial/stale always fails closed.
export const ONE_LOOP_ASSURANCE_CONTRACT='one-brain-original-loop-assurance-readback-v1';
const SOURCE='public.powerhouse_loop_assurance_state_v1';
const EXPECTED_LOOPS=15;
const MAX_AGE_MS=20*60*1000;
const allowedStatus=new Set(['GREEN','AMBER','RED']);
const safeLabel=value=>String(value??'').replace(/[^\w-]/g,'').slice(0,72);
const fail=reason=>Object.freeze({contract:ONE_LOOP_ASSURANCE_CONTRACT,status:'UNVERIFIED',reason,
  source:SOURCE,counts:null,overallStatus:'UNVERIFIED',loops:[],publisherAuthority:'existing-only',
  caveat:'Een status uit een bronview is geen provideruitkomst. Ontbrekend bewijs blijft onbekend.'});

export function summarizeOneLoopAssurance(rows,{observedAt=new Date().toISOString()}={}){
  if(!Array.isArray(rows)||rows.length!==EXPECTED_LOOPS)return fail('CANONICAL_15_LOOP_POPULATION_INCOMPLETE');
  const now=Date.parse(observedAt);
  if(!Number.isFinite(now))return fail('SERVER_OBSERVATION_INVALID');
  const keys=new Set();
  const loops=[];
  for(const row of rows){
    if(!row||typeof row.loop_key!=='string'||!row.loop_key||
       !allowedStatus.has(row.status)||keys.has(row.loop_key))return fail('LOOP_IDENTITY_OR_STATUS_INVALID');
    const check=Date.parse(row.checked_at||'');
    if(!Number.isFinite(check)||check>now+60000||now-check>MAX_AGE_MS)return fail('CANONICAL_ASSURANCE_NOT_FRESH');
    const required=Number(row.required_stage_count),fresh=Number(row.fresh_stage_count);
    if(!Number.isInteger(required)||required<1||required>20||
       !Number.isInteger(fresh)||fresh<0||fresh>required||
       !Array.isArray(row.missing_stages))return fail('LOOP_EVIDENCE_SHAPE_INVALID');
    const guard=row.evidence?.guard_pass;
    if(guard!==true&&guard!==false&&guard!==null&&guard!==undefined)return fail('LOOP_GUARD_SHAPE_INVALID');
    // Detect accidental fabricated green: a failed guard or missing stages
    // cannot be green, even if an upstream query claims otherwise.
    if(row.status==='GREEN'&&(guard===false||fresh!==required||row.missing_stages.length>0))
      return fail('CANONICAL_GREEN_CONFLICTS_WITH_EVIDENCE');
    keys.add(row.loop_key);
    const missing=[...new Set(row.missing_stages.map(safeLabel).filter(Boolean))].slice(0,20);
    loops.push(Object.freeze({key:safeLabel(row.loop_key),status:row.status,
      guard:guard===false?'FAILED':guard===true?'PASSED':'NOT_RECORDED',
      freshStages:fresh,requiredStages:required,missingStages:missing,
      problem:guard===false?'ORIGINAL_GUARD_FAILED':missing.length?'STAGE_EVIDENCE_MISSING':
        row.status==='GREEN'?'NONE':'CANONICAL_NON_GREEN',
      checkedAt:row.checked_at}));
  }
  if(keys.size!==EXPECTED_LOOPS||loops.some(row=>!row.key))return fail('LOOP_IDENTITY_COLLISION');
  loops.sort((a,b)=>({RED:0,AMBER:1,GREEN:2}[a.status]-{RED:0,AMBER:1,GREEN:2}[b.status])||a.key.localeCompare(b.key));
  const counts=Object.freeze({total:EXPECTED_LOOPS,green:loops.filter(x=>x.status==='GREEN').length,
    amber:loops.filter(x=>x.status==='AMBER').length,red:loops.filter(x=>x.status==='RED').length});
  return Object.freeze({contract:ONE_LOOP_ASSURANCE_CONTRACT,status:'READBACK_COMPLETE',reason:null,
    source:SOURCE,observedAt,counts,overallStatus:counts.red?'RED':counts.amber?'AMBER':'GREEN',
    loops,publisherAuthority:'existing-only',
    caveat:'Eén bestaande Brain/Heartbeat-lus; geen tweede executor of statuswrite. Guardfouten, menselijke toestemming en onafhankelijk provider-/omzetbewijs blijven afzonderlijk open.'});
}

export async function loadOneLoopAssurance({baseUrl='',key='',fetchImpl=globalThis.fetch,now=()=>new Date().toISOString()}={}){
  if(!/^https:\/\//.test(baseUrl)||!key)return fail('CANONICAL_SUPABASE_READBACK_NOT_CONFIGURED');
  try{
    const url=new URL('/rest/v1/powerhouse_loop_assurance_state_v1',baseUrl);
    url.searchParams.set('select','loop_key,status,checked_at,fresh_stage_count,required_stage_count,missing_stages,evidence');
    url.searchParams.set('limit','25');
    const response=await fetchImpl(url.toString(),{method:'GET',
      headers:{apikey:key,authorization:`Bearer ${key}`,accept:'application/json'},
      signal:AbortSignal.timeout(5000)});
    if(!response?.ok)return fail('CANONICAL_ASSURANCE_PROVIDER_'+(Number(response?.status)||'UNKNOWN'));
    const rows=await response.json().catch(()=>null);
    return summarizeOneLoopAssurance(rows,{observedAt:now()});
  }catch{return fail('CANONICAL_ASSURANCE_READBACK_FAILED');}
}
