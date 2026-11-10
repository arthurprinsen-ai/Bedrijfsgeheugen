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
  // Session-bound, in-memory handoff. It is deliberately NOT a server-durable
  // outbox; the original #4215 durable restart contract remains EVIDENCE_DUE.
  const pending=new Map();
  const authHeadersProvider=()=>stateClient.authHeaders();
  const principalFromSnapshot=()=>{
    const snap=stateClient.getSnapshot?.();
    return !stopped&&snap?.mode==='authenticated'&&!stateClient.isDemo?.()
      ? clean(snap.user?.id) : '';
  };
  let queuePrincipal=principalFromSnapshot();
  function currentPrincipal(){
    const principal=principalFromSnapshot();
    if(principal!==queuePrincipal){
      // Never replay tenant A's action or reuse its correlation under tenant B.
      for(const entry of pending.values())if(entry.timer)clearTimeout(entry.timer);
      pending.clear();
      lastCorrelationId='';
      lastRecordId='';
      sequence=0;
      queuePrincipal=principal;
    }
    return principal;
  }

  async function refresh(){
    if(stopped)return null;
    const sessionId=currentPrincipal();
    if(!sessionId)return null;
    if(activeRefresh)return activeRefresh;
    const stillSameSession=()=>currentPrincipal()===sessionId;
    activeRefresh=loadRuntimeEvidence({fetchImpl,domainState,authHeadersProvider,validateSession:stillSameSession})
      .then(runtime=>{if(runtime&&stillSameSession()){onRuntime(runtime);return runtime;}return null;})
      .finally(()=>{
        activeRefresh=null;
        // Existing 45-second/focus/identity readback is also the retry clock.
        // No extra interval, worker or second delivery authority is introduced.
        void flushPending();
      });
    return activeRefresh;
  }

  async function sendRecord(record,expectedPrincipal=currentPrincipal()){
    if(!expectedPrincipal||currentPrincipal()!==expectedPrincipal)return null;
    const headers=await authHeadersProvider();
    if(!/^Bearer\s+\S+/i.test(String(headers?.authorization||''))||currentPrincipal()!==expectedPrincipal)return null;
    const response=await fetchImpl('/api/brain-operating-loop',{
      method:'POST',
      credentials:'same-origin',
      headers:{...headers,accept:'application/json','content-type':'application/json'},
      body:JSON.stringify(record)
    });
    if(currentPrincipal()!==expectedPrincipal||!response.ok)return null;
    const body=await response.json().catch(()=>null);
    // HTTP 2xx is not an ACK. Require the exact original immutable Brain ID
    // and correlation before removing an item from the original queue.
    if(clean(body?.record?.id)!==record.id
        ||clean(body?.record?.correlationId)!==record.correlationId)return null;
    lastRecordId=record.id;
    lastCorrelationId=record.correlationId;
    await refresh().catch(()=>null);
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

  async function flushPending(){
    const principal=currentPrincipal();
    if(!principal||stopped)return;
    const tasks=[];
    for(const [key,entry] of pending){
      if(entry.principal!==principal||!entry.ready||entry.inflight)continue;
      entry.inflight=true;
      tasks.push((async()=>{
        try{
          const ack=await sendRecord(entry.record,principal);
          if(ack&&pending.get(key)===entry)pending.delete(key);
          // HTTP / network / incomplete ACK leaves the identical record queued
          // for the next existing readback. Never relabel a failed POST as done.
        }catch{
          // Retain the same immutable idempotency key, body and observedAt.
        }finally{entry.inflight=false;}
      })());
    }
    await Promise.all(tasks);
  }

  function queueEvidence(key,input,delay=350){
    const principal=currentPrincipal();
    if(!principal)return false;
    const payload=input?.__action
      ? Object.fromEntries(Object.entries(input).filter(([name])=>name!=='__action'))
      : input;
    const observedAt=payload?.observedAt||now();
    const record=input?.__action
      ?buildPortalAction({...payload,observedAt})
      :buildPortalEvidence({...payload,observedAt});
    const previous=pending.get(key);
    if(previous?.timer)clearTimeout(previous.timer);
    const entry={record,principal,ready:false,inflight:false,timer:null};
    pending.set(key,entry);
    entry.timer=setTimeout(()=>{
      entry.timer=null;
      if(pending.get(key)!==entry)return;
      entry.ready=true;
      void flushPending();
    },delay);
    return true;
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
    currentPrincipal(); // revoke old tenant queue immediately on identity change
    if(snapshot?.mode==='authenticated')refresh().catch(()=>null);
  });

  if(Number(intervalMs)>0)interval=setInterval(()=>{
    if(currentPrincipal())refresh().catch(()=>null);
  },Number(intervalMs));

  const onFocus=()=>{if(currentPrincipal())refresh().catch(()=>null);};
  globalThis.addEventListener?.('focus',onFocus);

  refresh().catch(()=>null);

  return Object.freeze({
    refresh,
    sendEvidence,
    sendAction,
    pendingHandoffs:()=>Object.freeze({pending:pending.size,unverified:[...pending.values()].filter(entry=>entry.ready).length}),
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
