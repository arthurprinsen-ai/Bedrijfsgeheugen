import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1';
export const AUDIT_FILE='artifacts/quality/original-innovation-owner-readback.json';
const MAX_ROWS=10000;
const PAGE_SIZE=250;

const SOURCES=Object.freeze([
  Object.freeze({
    name:'candidates',table:'powerhouse_optimization_candidate_v1',
    select:'candidate_id,source_key,owner_agent,safety_class,status,created_at,component_id,proposed_action,rollback_plan,baseline,expected_impact',
    filters:{tenant_id:'eq.canonical'},order:'created_at.asc,candidate_id.asc',
    id:'candidate_id'
  }),
  Object.freeze({
    name:'obligations',table:'brain_obligations',
    select:'business_entity,change_id,owner,state,payload_sha256,evidence',
    filters:{obligation_type:'eq.INNOVATION_DELIVERY',capability_id:'eq.powerhouse-self-improvement-layer-v1'},
    order:'business_entity.asc',id:'business_entity'
  }),
  Object.freeze({
    name:'intakes',table:'brain_operations',
    select:'id,operation_type,capability_id,status,correlation_id,idempotency_key,payload_sha256,change_id,remote_ref,evidence,version',
    filters:{operation_type:'eq.INNOVATION_INTAKE'},
    order:'id.asc',id:'id'
  }),
]);

function positiveInteger(value){return Number.isSafeInteger(value)&&value>=0;}
function reject(code){throw new Error('ORIGINAL_INNOVATION_'+code);}
function ownerFor(raw){
  if(raw==='engineering')return 'agent:agent-integration-engineer';
  if(raw==='cro')return 'agent:agent-growth-market';
  reject('OWNER_UNMAPPED');
}

export async function readCanonicalRows({config,fetchImpl=globalThis.fetch}={}){
  if(!config?.origin||!config?.key||typeof fetchImpl!=='function')reject('SOURCE_AUTH_UNAVAILABLE');
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.origin))reject('SOURCE_HOST_UNTRUSTED');
  const result={};
  for(const source of SOURCES){
    const rows=[]; let offset=0,total=null;
    do{
      if(offset>=MAX_ROWS)reject('SOURCE_UNBOUNDED_'+source.name);
      const params=new URLSearchParams({select:source.select,order:source.order,...source.filters});
      const url=config.origin+'/rest/v1/'+source.table+'?'+params;
      let response;
      try{
        response=await fetchImpl(url,{method:'GET',
          headers:{apikey:config.key,Authorization:'Bearer '+config.key,
            Accept:'application/json',Prefer:'count=exact',
            Range:offset+'-'+(offset+PAGE_SIZE-1)},
          signal:AbortSignal.timeout(20000)
        });
      }catch{reject('PROVIDER_UNAVAILABLE_'+source.name);}
      if(!response?.ok)reject('PROVIDER_HTTP_'+source.name+'_'+(response?.status??'unknown'));
      const range=response.headers?.get?.('content-range');
      let page;
      try{page=await response.json();}catch{reject('PROVIDER_JSON_INVALID_'+source.name);}
      if(!Array.isArray(page)||page.length>PAGE_SIZE)reject('PROVIDER_ROWS_INVALID_'+source.name);
      if(range==='*/0'&&offset===0&&page.length===0){total=0;break;}
      const parsed=/^(\d+)-(\d+)\/(\d+)$/.exec(range??'');
      if(!parsed)reject('EXACT_COUNT_MISSING_'+source.name);
      const [,fromRaw,toRaw,countRaw]=parsed;
      const from=Number(fromRaw),to=Number(toRaw),count=Number(countRaw);
      if(![from,to,count].every(positiveInteger)||from!==offset||
          to-from+1!==page.length||count>MAX_ROWS||count<to+1||
          (total!==null&&count!==total))reject('SOURCE_PAGINATION_DRIFT_'+source.name);
      if(page.length===0)reject('SOURCE_INCOMPLETE_'+source.name);
      total=count;
      rows.push(...page);
      offset+=page.length;
    }while(offset<total);
    if(rows.length!==total)reject('SOURCE_CARDINALITY_MISMATCH_'+source.name);
    const keys=new Set();
    for(const row of rows){
      const id=String(row?.[source.id]??'').trim();
      if(!id||keys.has(id))reject('SOURCE_DUPLICATE_'+source.name);
      keys.add(id);
    }
    result[source.name]=rows;
  }
  return result;
}

export function evaluateOriginalOwnerHandoff(snapshot,{now=new Date().toISOString()}={}){
  if(!Number.isFinite(Date.parse(now)))reject('CLOCK_INVALID');
  const candidates=snapshot?.candidates,obligations=snapshot?.obligations,intakes=snapshot?.intakes;
  if(![candidates,obligations,intakes].every(Array.isArray))reject('SNAPSHOT_INVALID');
  const byOb=new Map(obligations.map(r=>[String(r.business_entity),r]));
  const byIntake=new Map(intakes.map(r=>[String(r.correlation_id),r]));
  if(byOb.size!==obligations.length||byIntake.size!==intakes.length)reject('SOURCE_DUPLICATE_IDENTITY');
  const packet=[];
  for(const candidate of candidates){
    const id=String(candidate?.candidate_id??'');
    const owner=ownerFor(candidate?.owner_agent);
    const originalObligation=byOb.get(id);
    const intake=byIntake.get('innovation-delivery:'+id);
    if(!originalObligation||!intake)reject('HANDOFF_MISSING');
    if(!/^[a-f0-9]{64}$/i.test(originalObligation.payload_sha256??''))reject('SOURCE_HASH_INVALID');
    const revision=originalObligation.evidence?.source_revision;
    if(!revision||String(originalObligation.change_id)!==String(candidate.source_key)||
        originalObligation.owner!=='original-agent:'+candidate.owner_agent||
        !['OPEN','READY','RUNNING','FULFILLED'].includes(originalObligation.state)||
        intake.operation_type!=='INNOVATION_INTAKE'||
        intake.capability_id!==owner||
        intake.change_id!==candidate.source_key||
        intake.payload_sha256!==originalObligation.payload_sha256||
        intake.idempotency_key!=='innovation-delivery:'+id+':'+originalObligation.payload_sha256.slice(0,16)){
      reject('SOURCE_BOUND_IDENTITY_MISMATCH');
    }
    if(!Number.isFinite(Date.parse(candidate.created_at)))reject('SOURCE_TIMESTAMP_INVALID');
    const evidence=intake.evidence??{};
    const independentAck=intake.status==='VERIFIED'&&
      typeof intake.remote_ref==='string'&&intake.remote_ref.trim().length>0&&
      evidence.consumer_owner===owner&&
      evidence.source_revision===revision&&
      evidence.independent_consumer_readback===true;
    if(intake.status==='VERIFIED'&&!independentAck)reject('UNVERIFIED_CONSUMER_CLAIM');
    packet.push(Object.freeze({
      candidate_id:id,source_key:String(candidate.source_key),source_revision:String(revision),
      original_operation_id:String(intake.id),
      original_owner:owner, original_status:String(intake.status),
      obligation_state:String(originalObligation.state),
      safety_class:String(candidate.safety_class),
      age_days:Math.max(0,Math.floor((Date.parse(now)-Date.parse(candidate.created_at))/86400000)),
      consumer_ack_verified:independentAck,
      result_proven:false,
      next_action:independentAck?'Independently measure protected implementation and outcome before delivery closure':
        'Original owner must review candidate, claim exact source revision, execute through protected authority and return independently verified consumer receipt'
    }));
  }
  if(packet.length!==obligations.length||packet.length!==intakes.length)reject('SOURCE_UNMATCHED_OPERATION');
  packet.sort((a,b)=>b.age_days-a.age_days||a.candidate_id.localeCompare(b.candidate_id));
  const ack=packet.filter(x=>x.consumer_ack_verified).length;
  const health=packet.length===0?'NO_SOURCE_CANDIDATES':ack<packet.length?'OWNER_ACK_PENDING':'INNOVATION_OUTCOME_UNVERIFIED';
  return Object.freeze({
    contract:CONTRACT, observed_at:now, source:'original Supabase PostgREST exact-count readback',
    health, terminal_innovation_success:false,
    counts:Object.freeze({candidates:packet.length,obligations:obligations.length,
      intakes:intakes.length,owner_ack_verified:ack,owner_ack_pending:packet.length-ack,
      measured_outcomes_verified:0}),
    assigned_original_agents:Object.freeze({engineering:packet.filter(x=>x.original_owner==='agent:agent-integration-engineer').length,
      cro:packet.filter(x=>x.original_owner==='agent:agent-growth-market').length}),
    no_new_executor:true,no_new_scheduler:true,no_new_queue:true,
    read_only:true,review_required:true,
    tasks:packet
  });
}

export async function runOriginalInnovationOwnerAudit({env=process.env,fetchImpl=globalThis.fetch,now=new Date().toISOString()}={}){
  const config=trustedBrainReadConfig(env);
  const snapshot=await readCanonicalRows({config,fetchImpl});
  return evaluateOriginalOwnerHandoff(snapshot,{now});
}

export function summarizeOriginalOwnerAudit(report){
  // GitHub Actions artifacts may be readable by users of this public repo.
  // Detailed canonical candidate and Brain operation IDs must remain server-only.
  // Never persist the internal source packet into a GitHub build artifact.
  return Object.freeze({
    contract:report?.contract??CONTRACT,
    observed_at:report?.observed_at??null,
    health:report?.health??'SOURCE_UNAVAILABLE',
    counts:report?.counts??null,
    assigned_original_agents:report?.assigned_original_agents??null,
    owner_ack_due:report?.counts?.owner_ack_pending??null,
    original_owner_packet_redacted:true,
    source_identity_details:'CANONICAL_SUPABASE_ONLY',
    terminal_innovation_success:false,
    read_only:true,no_new_scheduler:true,no_new_queue:true,
    error_code:report?.health==='SOURCE_UNAVAILABLE'?
      String(report?.error_code||'UNKNOWN').slice(0,120):null,
  });
}

async function main(){
  let report;
  try{
    report=await runOriginalInnovationOwnerAudit();
    process.stdout.write(JSON.stringify({contract:report.contract,health:report.health,counts:report.counts,
      assigned_original_agents:report.assigned_original_agents,consumer_claimed:false,
      external_side_effect:false,original_intakes_never_silently_dropped:true})+'\n');
    if(report.health!=='INNOVATION_OUTCOME_UNVERIFIED')
      process.stdout.write('::warning::ORIGINAL_INNOVATION_OWNER_ACK_PENDING: check existing ONE BRAIN intake source and original owner\n');
  }catch(error){
    report={contract:CONTRACT,health:'SOURCE_UNAVAILABLE',error_code:String(error?.message??'UNKNOWN'),
      read_only:true,consumer_ack_verified:false,terminal_innovation_success:false};
    process.stderr.write('ORIGINAL_INNOVATION_OWNER_AUDIT_FAILED:'+report.error_code+'\n');
    process.exitCode=1;
  }finally{
    await mkdir('artifacts/quality',{recursive:true});
    await writeFile(AUDIT_FILE,JSON.stringify(summarizeOriginalOwnerAudit(report),null,2)+'\n');
  }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await main();
