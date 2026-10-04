import { loadRuntimeEvidence } from './runtime-evidence.js';

const clean=value=>String(value??'').trim();
const randomId=()=>globalThis.crypto?.randomUUID?.()||`portal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const safeDetail=input=>{
  const source=input&&typeof input==='object'?input:{};
  const output={};
  for(const key of ['metric','scenario','label','visual','event','decisionId','actionId','page','horizon','confidence','sourceType','action']){
    if(source[key]!==undefined&&source[key]!==null) output[key]=typeof source[key]==='number'?source[key]:clean(source[key]).slice(0,220);
  }
  return output;
};

export function portalCorrelationFromStored(result={}){
  const revision=clean(result?.sourceRevision);
  return revision?`PORTAL_INPUT-${revision}`:'';
}

export function buildPortalEvidence({event='portal_interaction',detail={},correlationId='',predecessorIds=[],idempotencyKey='',observedAt=new Date().toISOString(),id=randomId()}={}){
  const safe=safeDetail(detail);
  const correlation=clean(correlationId)||`PORTAL_UI-${id}`;
  const key=clean(idempotencyKey)||`portal-ui:${event}:${id}`;
  return Object.freeze({
    type:'Evidence',
    id:`PORTAL_EVIDENCE-${id}`,
    subjectId:`portal:${clean(event)||'interaction'}`,
    correlationId:correlation,
    predecessorIds:[...new Set((Array.isArray(predecessorIds)?predecessorIds:[]).map(clean).filter(Boolean))],
    idempotencyKey:key,
    owner:'portal-v2',
    actor:'portal-v2',
    actorType:'system',
    status:'OBSERVED',
    observedAt,
    executed:false,
    verified:false,
    evidenceIds:[],
    source:'portal-v2',
    payload:{event:clean(event)||'portal_interaction',...safe}
  });
}

export function buildPortalAction({detail={},correlationId='',predecessorIds=[],idempotencyKey='',observedAt=new Date().toISOString(),id=randomId()}={}){
  const safe=safeDetail(detail);
  const correlation=clean(correlationId)||`PORTAL_UI-${id}`;
  const key=clean(idempotencyKey)||`portal-action:${id}`;
  const actionId=`PORTAL_ACTION-${id}`;
  return Object.freeze({
    type:'Action',
    id:actionId,
    actionId,
    subjectId:`portal-action:${clean(safe.label||safe.metric||safe.visual||'user-intent').slice(0,120)}`,
    correlationId:correlation,
    predecessorIds:[...new Set((Array.isArray(predecessorIds)?predecessorIds:[]).map(clean).filter(Boolean))],
    idempotencyKey:key,
    owner:'portal-user',
    actor:'portal-user',
    actorType:'human',
    status:'REQUESTED',
    observedAt,
    executed:false,
    verified:false,
    evidenceIds:[],
    source:'portal-v2',
    payload:{intent:'create_action',...safe}
  });
}

export function createPowerhouseRuntimeBridge({
  stateClient,
  domainState,
  fetchImpl=globalThis.fetch,
  eventTarget=globalThis,
  onRuntime=()=>{},
  intervalMs=45_000,
  now=()=>new Date().toISOString()
}={}){
  if(!stateClient?.authHeaders) throw new TypeError('PORTAL_STATE_AUTH_HEADERS_REQUIRED');
  if(!domainState?.get) throw new TypeError('PORTAL_DOMAIN_STATE_REQUIRED');
  if(typeof fetchImpl!=='function') throw new TypeError('FETCH_REQUIRED');

  let stopped=false;
  let activeRefresh=null;
  let interval=null;
  let sequence=0;
  let lastCorrelationId='';
  let lastRecordId='';
  const pending=new Map();
  const authHeadersProvider=()=>stateClient.authHeaders();

  async function refresh(){
    if(stopped)return null;
    if(activeRefresh)return activeRefresh;
    activeRefresh=loadRuntimeEvidence({fetchImpl,domainState,authHeadersProvider})
      .then(runtime=>{if(runtime){onRuntime(runtime);return runtime;}return null;})
      .finally(()=>{activeRefresh=null;});
    return activeRefresh;
  }

  async function sendRecord(record){
    if(stopped)return null;
    const headers=await authHeadersProvider();
    if(!headers?.authorization)return null;
    const response=await fetchImpl('/api/brain-operating-loop',{
      method:'POST',
      credentials:'same-origin',
      headers:{...headers,accept:'application/json','content-type':'application/json'},
      body:JSON.stringify(record)
    });
    if(!response.ok)return null;
    const body=await response.json().catch(()=>null);
    const storedId=clean(body?.record?.id);
    if(storedId)lastRecordId=storedId;
    const correlation=clean(body?.record?.correlationId||record?.correlationId);
    if(correlation)lastCorrelationId=correlation;
    await refresh();
    return body;
  }

  async function sendEvidence(input){
    const evidence=buildPortalEvidence({...input,observedAt:input?.observedAt||now()});
    return sendRecord(evidence);
  }

  async function sendAction(input){
    const action=buildPortalAction({...input,observedAt:input?.observedAt||now()});
    return sendRecord(action);
  }

  function queueEvidence(key,input,delay=350){
    if(stopped)return;
    const existing=pending.get(key);
    if(existing)clearTimeout(existing.timer);
    const timer=setTimeout(()=>{
      pending.delete(key);
      const sender=input?.__action?sendAction:sendEvidence;
      const payload=input?.__action?Object.fromEntries(Object.entries(input).filter(([key])=>key!=='__action')):input;
      sender(payload).catch(()=>null);
    },delay);
    pending.set(key,{timer,input});
  }

  const onBrainSynced=event=>{
    const stored=Array.isArray(event?.detail?.stored)?event.detail.stored:[];
    for(const result of stored){
      const correlationId=portalCorrelationFromStored(result);
      if(!correlationId)continue;
      lastCorrelationId=correlationId;
      const predecessors=[result?.brainRecordId,result?.currentStateRecordId].filter(Boolean);
      queueEvidence(`sync:${result.sourceRevision}`,{
        event:'portal_projection_synced',
        detail:{event:'portal_projection_synced',page:'runtime'},
        correlationId,
        predecessorIds:predecessors,
        id:`sync-${result.sourceRevision}`,
        idempotencyKey:`portal-projection-synced:${result.sourceRevision}`
      },50);
    }
    refresh().catch(()=>null);
  };

  const onFutureLens=event=>{
    sequence+=1;
    const detail=safeDetail(event?.detail);
    queueEvidence('future-lens',{
      event:'future_lens_changed',
      detail,
      id:`future-${sequence}`,
      idempotencyKey:`portal-session:${sequence}:future-lens`
    },500);
  };

  const onSemanticPoint=event=>{
    sequence+=1;
    const detail=safeDetail(event?.detail);
    queueEvidence('semantic-point',{
      event:'visual_datapoint_selected',
      detail,
      id:`semantic-${sequence}`,
      idempotencyKey:`portal-session:${sequence}:semantic-point`
    },250);
  };

  const onNextgenInsight=event=>{
    sequence+=1;
    const detail=safeDetail(event?.detail);
    queueEvidence('context-inspector',{
      event:'context_inspector_opened',
      detail,
      id:`context-${sequence}`,
      idempotencyKey:`portal-session:${sequence}:context-inspector`
    },250);
  };

  const onActionIntent=event=>{
    sequence+=1;
    const detail=safeDetail(event?.detail);
    const correlationId=clean(event?.detail?.correlationId)||lastCorrelationId||'';
    const predecessorIds=[clean(event?.detail?.predecessorId),lastRecordId].filter(Boolean);
    queueEvidence(`action-intent:${sequence}`,{
      __action:true,
      event:'portal_action_requested',
      detail,
      correlationId,
      predecessorIds,
      id:`action-${sequence}`,
      idempotencyKey:`portal-session:${sequence}:action-intent`
    },25);
  };

  const listeners=[
    ['bg:portal-brain-synced',onBrainSynced],
    ['portal:future-lens-change',onFutureLens],
    ['portal:semantic-point-select',onSemanticPoint],
    ['portal:nextgen-insight',onNextgenInsight],
    ['portal:action-intent',onActionIntent]
  ];
  for(const [name,handler] of listeners)eventTarget?.addEventListener?.(name,handler);

  const unsubscribe=stateClient.subscribe?.(snapshot=>{
    if(snapshot?.mode==='authenticated')refresh().catch(()=>null);
  });

  if(Number(intervalMs)>0)interval=setInterval(()=>{
    const snap=stateClient.getSnapshot?.();
    if(snap?.mode==='authenticated')refresh().catch(()=>null);
  },Number(intervalMs));

  const onFocus=()=>{if(stateClient.getSnapshot?.()?.mode==='authenticated')refresh().catch(()=>null);};
  globalThis.addEventListener?.('focus',onFocus);

  refresh().catch(()=>null);

  return Object.freeze({
    refresh,
    sendEvidence,
    sendAction,
    destroy(){
      stopped=true;
      unsubscribe?.();
      if(interval)clearInterval(interval);
      for(const {timer} of pending.values())clearTimeout(timer);
      pending.clear();
      for(const [name,handler] of listeners)eventTarget?.removeEventListener?.(name,handler);
      globalThis.removeEventListener?.('focus',onFocus);
    }
  });
}

export function mountPowerhouseRuntimeBridge(options={}){
  return createPowerhouseRuntimeBridge(options);
}
