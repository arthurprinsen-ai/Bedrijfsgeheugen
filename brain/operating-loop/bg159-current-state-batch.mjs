import { createBg159CurrentStateInput } from './bg159-current-state-adapter.mjs';

const required=(value,name)=>{
  if(value===undefined||value===null||String(value).trim()==='') throw new TypeError(`BG159 CurrentState batch requires ${name}`);
  return String(value).trim();
};

export function createBg159CurrentStateInputs({tenantId,executionId,snapshot}={}){
  const tenant=required(tenantId,'tenantId');
  const execution=required(executionId,'executionId');
  if(!snapshot||typeof snapshot!=='object') throw new TypeError('BG159 CurrentState batch requires snapshot');
  const snapshotAt=required(snapshot.at??snapshot.snapshot_at,'snapshot time');
  if(!Array.isArray(snapshot.catalog)) throw new TypeError('BG159 CurrentState batch requires catalog');

  const seen=new Set();
  return snapshot.catalog.map(item=>{
    const scenarioId=Number(item?.id);
    if(!Number.isFinite(scenarioId)) throw new TypeError('BG159 CurrentState batch requires numeric scenario identity');
    if(seen.has(scenarioId)) throw new TypeError(`BG159 CurrentState batch duplicate scenario identity: ${scenarioId}`);
    seen.add(scenarioId);
    return createBg159CurrentStateInput({
      tenantId:tenant,
      executionId:execution,
      snapshotAt,
      item,
      revision:item?.lastEdit??item?.last_edit??null
    });
  });
}
