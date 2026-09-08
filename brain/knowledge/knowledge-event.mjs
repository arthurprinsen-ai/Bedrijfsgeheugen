import crypto from 'node:crypto';

const SOURCE_TYPES=new Set(['chat','agent','github','netlify','make','notion','portal','crm','human','other']);
const OUTCOME_STATES=new Set(['success','failed','partial','blocked','open']);
const SECRET_PATTERN=/(authorization|api[_-]?key|bearer\s+[a-z0-9._-]+|password|token\s*[=:])/i;

const clean=v=>String(v??'').trim();
const clone=v=>structuredClone(v);
const freezeDeep=value=>{
  if(value&&typeof value==='object'&&!Object.isFrozen(value)){
    Object.freeze(value);
    for(const child of Object.values(value)) freezeDeep(child);
  }
  return value;
};

function defaultId(){return crypto.randomUUID();}
function producerFromActor(actor={}){
  const type=clean(actor.type)||'service';
  const id=clean(actor.id)||clean(actor.name)||'unknown';
  return `${type}:${id}`;
}
function traceId(eventId){return `knowledge:${eventId}`;}
function correlationId(input,eventId){return clean(input.correlation_id)||clean(input.correlationId)||eventId;}
function defaultOutcome(input){
  if(input&&typeof input==='object'&&OUTCOME_STATES.has(input.status)) return {status:input.status,summary:clean(input.summary)};
  const status=OUTCOME_STATES.has(input)?input:'open';
  return {status,summary:''};
}

export function validateKnowledgeEvent(event={}){
  const errors=[];
  if(event.schema_version!=='powerhouse.knowledge-event.v1') errors.push('schema_version');
  if(!clean(event.event_id)) errors.push('event_id');
  if(!clean(event.id)) errors.push('id');
  if(!clean(event.created_at)||!clean(event.captured_at)) errors.push('timestamps');
  if(!SOURCE_TYPES.has(event.source_type)) errors.push('source_type');
  if(!Array.isArray(event.source_refs)||event.source_refs.length===0) errors.push('source_refs');
  if(!clean(event.producer)) errors.push('producer');
  if(!clean(event.component)) errors.push('component');
  if(!clean(event.intent)) errors.push('intent');
  if(!OUTCOME_STATES.has(event.outcome?.status)) errors.push('outcome.status');
  if(!Array.isArray(event.provenance)||event.provenance.length===0) errors.push('provenance');
  if(SECRET_PATTERN.test(JSON.stringify(event))) errors.push('secret-like content');
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors)});
}

export function normalizeKnowledgeEvent(input={}, {now=()=>new Date().toISOString(),idFactory=defaultId}={}){
  const eventId=clean(input.event_id)||clean(idFactory());
  const capturedAt=clean(input.captured_at)||clean(now());
  const actor=clone(input.actor||{type:'service',id:'powerhouse'});
  const sourceRefs=clone(Array.isArray(input.source_refs)?input.source_refs:[]);
  const outcome=defaultOutcome(input.outcome);
  const event={
    ...clone(input),
    schema_version:'powerhouse.knowledge-event.v1',
    event_id:eventId,
    id:eventId,
    captured_at:capturedAt,
    created_at:capturedAt,
    source_type:clean(input.source_type),
    source_refs:sourceRefs,
    actor,
    producer:clean(input.producer)||producerFromActor(actor),
    trace_id:clean(input.trace_id)||traceId(eventId),
    correlation_id:correlationId(input,eventId),
    classification:clean(input.classification)||'KNOWLEDGE_EVENT',
    data_quality:clean(input.data_quality)||'NORMALIZED',
    confidence:Number.isFinite(Number(input.confidence))?Number(input.confidence):1,
    provenance:clone(Array.isArray(input.provenance)?input.provenance:sourceRefs),
    component:clean(input.component),
    architecture_layer:clean(input.architecture_layer)||'knowledge',
    intent:clean(input.intent),
    context_summary:clean(input.context_summary),
    decision:clone(input.decision||{decision:'',rationale:'',owner:''}),
    action:clone(input.action||{summary:'',technical_changes:[]}),
    evidence:clone(Array.isArray(input.evidence)?input.evidence:[]),
    outcome,
    root_cause:input.root_cause??null,
    learning:input.learning??null,
    guard_prevention:clone(Array.isArray(input.guard_prevention)?input.guard_prevention:[]),
    regression:clone(Array.isArray(input.regression)?input.regression:[]),
    architecture_impact:clone(input.architecture_impact||{components:[],dependencies:[],blast_radius:[],documentation_surfaces:[]}),
    rollback:clone(input.rollback||{strategy:'',last_known_good_ref:null}),
    cost_signal:input.cost_signal??null,
    health_signal:input.health_signal??null,
    next_decision:input.next_decision??null,
    writeback:clone(input.writeback||{state:'pending',bg168_ref:null,bg166_ref:null}),
    readback:clone(input.readback||{state:'pending',bg167_ref:null,verified_at:null})
  };
  return freezeDeep(event);
}
