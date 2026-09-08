const clone=value=>structuredClone(value);
const keyFor=event=>String(event?.dedupe_key||event?.fingerprint||event?.event_id||'').trim();

export function memoryReplayStore(){
  const records=new Map();
  return Object.freeze({
    async get(key){return records.has(key)?clone(records.get(key)):null;},
    async put(key,value){records.set(key,clone(value));return clone(value);},
    async list(){return [...records.values()].map(clone);}
  });
}

export function createReplaySpool(store,{now=()=>new Date().toISOString()}={}){
  if(!store||typeof store.get!=='function'||typeof store.put!=='function'||typeof store.list!=='function') throw new TypeError('replay spool requires get/put/list store');

  async function defer(event,reason){
    const key=keyFor(event); if(!key) throw new TypeError('replay event requires dedupe_key, fingerprint or event_id');
    const existing=await store.get(key);
    if(existing&&existing.state!=='VERIFIED') return existing;
    const at=now();
    return store.put(key,{dedupe_key:key,event_id:String(event.event_id||''),fingerprint:event.fingerprint||null,event_json:clone(event),reason:String(reason||'UNKNOWN'),state:'OPEN',attempt_count:0,bg168_ref:null,bg166_ref:null,bg167_ref:null,created_at:at,updated_at:at,verified_at:null});
  }
  async function listOpen(){
    const records=await store.list();
    return records.filter(x=>x.state!=='VERIFIED').sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
  }
  async function claim(key){
    const current=await store.get(key);
    if(!current) throw new Error(`missing replay obligation: ${key}`);
    if(current.state!=='OPEN') return {claimed:false,obligation:current};
    const next={...current,state:'CLAIMED',attempt_count:Number(current.attempt_count||0)+1,updated_at:now()};
    return {claimed:true,obligation:await store.put(key,next)};
  }
  async function markWritten(key,refs={}){
    const current=await store.get(key);
    if(!current) throw new Error(`missing replay obligation: ${key}`);
    if(!['OPEN','CLAIMED','WRITTEN'].includes(current.state)) throw new Error(`cannot mark ${current.state} obligation written`);
    return store.put(key,{...current,state:'WRITTEN',bg168_ref:refs.bg168_ref??current.bg168_ref??null,bg166_ref:refs.bg166_ref??current.bg166_ref??null,updated_at:now()});
  }
  async function markVerified(key,bg167Ref){
    const current=await store.get(key);
    if(!current) throw new Error(`missing replay obligation: ${key}`);
    if(current.state!=='WRITTEN') throw new Error('BG167 verification requires WRITTEN state');
    const ref=String(bg167Ref||'').trim(); if(!ref) throw new Error('BG167 verification requires readback ref');
    const at=now();
    return store.put(key,{...current,state:'VERIFIED',bg167_ref:ref,verified_at:at,updated_at:at});
  }
  return Object.freeze({defer,listOpen,claim,markWritten,markVerified});
}
