const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const arr=value=>Array.isArray(value)?value:[];
const num=value=>value==null||(typeof value==='string'&&!value.trim())?null:Number.isFinite(Number(value))?Number(value):null;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

function outcomePool(state={}){
  return [
    ...arr(state?.portal?.runtime?.outcomes?.items),
    ...arr(state?.portal?.outcomes?.items),
    ...arr(state?.portal?.outcomes),
    ...arr(state?.outcomes)
  ];
}
function identity(item={}){
  const scenario=item?.goalScenario||item?.goal_scenario||item?.payload?.goalScenario||item?.payload?.goal_scenario||{};
  return {
    goalId:String(scenario.goalId||scenario.goal_id||item?.goalId||item?.goal_id||item?.payload?.goalId||item?.payload?.goal_id||'').trim(),
    leverId:String(scenario.leverId||scenario.lever_id||item?.leverId||item?.lever_id||item?.payload?.leverId||item?.payload?.lever_id||'').trim()
  };
}
function expected(item={}){
  const scenario=item?.goalScenario||item?.goal_scenario||item?.payload?.goalScenario||item?.payload?.goal_scenario||{};
  return num(scenario.expectedEffect??scenario.expected_effect??item?.expectedEffect??item?.expected_effect??item?.payload?.expectedEffect??item?.payload?.expected_effect);
}
function realized(item={}){
  return num(item?.realizedEffect??item?.realized_effect??item?.measuredEffect??item?.measured_effect??item?.effect??item?.value??item?.payload?.realizedEffect??item?.payload?.realized_effect);
}
function refs(item={}){
  // Only canonical outcome proof IDs can train the forecast. Input/source refs
  // establish context but do not establish that an effect actually occurred.
  const proof=item?.evidenceIds??item?.evidence_ids??item?.payload?.evidenceIds??item?.payload?.evidence_ids;
  return [...new Set(arr(proof).filter(x=>typeof x==='string').map(x=>x.trim()).filter(Boolean))];
}
function verified(item={}){
  const status=String(item?.verificationStatus||item?.verification_status||item?.status||item?.payload?.status||'').trim().toUpperCase();
  if(!refs(item).length)return false;
  if(['REJECTED','FAILED','CANCELLED','PENDING','DRAFT','ESTIMATED','UNVERIFIED'].includes(status))return false;
  // Completing an action, displaying a healthy UI, or citing a source is not
  // independently verified realization. Require an affirmative outcome signal.
  return item?.verified===true||['VERIFIED','CONFIRMED','SETTLED','MEASURED'].includes(status);
}
function ratio(expectedValue,realizedValue){
  if(expectedValue==null||realizedValue==null||expectedValue===0)return null;
  return realizedValue/expectedValue;
}
function classification(r){
  if(r==null)return 'unquantified';
  if(r>=1.15)return 'overperformed';
  if(r>=.85)return 'within-range';
  if(r>=0)return 'underperformed';
  return 'opposite-direction';
}
function median(values){
  const xs=values.filter(Number.isFinite).sort((a,b)=>a-b);
  if(!xs.length)return null;
  const mid=Math.floor(xs.length/2);
  return xs.length%2?xs[mid]:(xs[mid-1]+xs[mid])/2;
}

export function buildGoalOutcomeLearning(state={},goalId=null){
  const records=outcomePool(state).map(item=>{
    const ids=identity(item),exp=expected(item),real=realized(item),r=ratio(exp,real);
    return freeze({
      id:item?.id||item?.outcomeId||item?.outcome_id||null,
      goalId:ids.goalId,
      leverId:ids.leverId,
      expectedEffect:exp,
      realizedEffect:real,
      ratio:r==null?null:Number(r.toFixed(3)),
      classification:classification(r),
      verified:verified(item),
      evidenceRefs:freeze(refs(item)),
      observedAt:item?.observedAt||item?.observed_at||item?.updatedAt||item?.updated_at||null
    });
  }).filter(item=>item.goalId&&item.leverId&&(!goalId||item.goalId===goalId));

  const byLever={};
  for(const record of records){
    const key=record.goalId+':'+record.leverId;
    (byLever[key]||(byLever[key]=[])).push(record);
  }
  // A repeated record, replayed source, or multi-lever reuse of one receipt
  // must never supply additional observations to the same learning cycle.
  const consumedIds=new Set(),consumedProof=new Set();
  const calibrations=Object.entries(byLever).map(([key,items])=>{
    const verifiedItems=items.filter(x=>{
      if(!x.verified||x.ratio==null||!Number.isFinite(x.ratio))return false;
      const id=x.id==null?'':String(x.id).trim();
      if(id&&consumedIds.has(id))return false;
      if(x.evidenceRefs.some(ref=>consumedProof.has(ref)))return false;
      if(id)consumedIds.add(id);
      x.evidenceRefs.forEach(ref=>consumedProof.add(ref));
      return true;
    });
    const med=median(verifiedItems.map(x=>x.ratio));
    const factor=verifiedItems.length>=3&&med!=null?clamp(med,.25,2):null;
    const [g,l]=key.split(':');
    return freeze({
      goalId:g,
      leverId:l,
      observations:items.length,
      verifiedObservations:verifiedItems.length,
      medianRealizationRatio:med==null?null:Number(med.toFixed(3)),
      calibrationFactor:factor==null?null:Number(factor.toFixed(3)),
      calibrationStatus:factor==null?'insufficient-evidence':'available',
      truth:factor==null?'min-3-verified-outcomes-required':'derived-from-verified-outcomes'
    });
  });
  return freeze({
    schemaVersion:'goal-outcome-learning.v1',
    records:freeze(records),
    calibrations:freeze(calibrations),
    verifiedOutcomes:calibrations.reduce((sum,item)=>sum+item.verifiedObservations,0),
    quantifiedOutcomes:records.filter(x=>x.realizedEffect!=null).length
  });
}

export function calibrationFor(state={},goalId,leverId){
  const learning=buildGoalOutcomeLearning(state,goalId);
  return learning.calibrations.find(x=>x.goalId===goalId&&x.leverId===leverId)||freeze({
    goalId,leverId,observations:0,verifiedObservations:0,medianRealizationRatio:null,calibrationFactor:null,calibrationStatus:'insufficient-evidence',truth:'min-3-verified-outcomes-required'
  });
}
