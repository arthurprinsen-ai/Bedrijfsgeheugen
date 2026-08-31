export const WHOLE_BRAIN_STAGES=Object.freeze(['evidence','graph','intelligence','impact','decision','action','execution','verification','value','learning','memory','graph_feedback']);

function stageOf(record){
  if(record?.kind==='evidence') return 'evidence';
  if((record?.kind==='entity'||record?.kind==='relation')&&record?.payload?.loopStage!=='graph_feedback') return 'graph';
  if(record?.kind==='signal'||record?.kind==='opportunity') return 'intelligence';
  if(record?.kind==='impact') return 'impact';
  if(record?.kind==='decision') return 'decision';
  if(record?.kind==='action') return 'action';
  if(record?.kind==='execution') return 'execution';
  if(record?.kind==='verification') return 'verification';
  if(record?.kind==='value') return 'value';
  if(record?.kind==='learning') return 'learning';
  if(record?.kind==='memory') return 'memory';
  if(record?.kind==='relation'&&record?.payload?.loopStage==='graph_feedback') return 'graph_feedback';
  return null;
}

export function assertClosedBrainLoop(records,{correlationId}={}){
  if(!correlationId) throw new TypeError('closed loop requires correlationId');
  const scoped=(Array.isArray(records)?records:[]).filter(record=>record?.correlationId===correlationId);
  if(!scoped.length) throw new Error(`closed loop missing records for ${correlationId}`);
  const byStage=new Map(WHOLE_BRAIN_STAGES.map(stage=>[stage,[]]));
  for(const record of scoped){const stage=stageOf(record);if(stage) byStage.get(stage).push(record);}
  for(const stage of WHOLE_BRAIN_STAGES) if(!byStage.get(stage).length) throw new Error(`closed loop missing ${stage} stage`);
  for(let index=1;index<WHOLE_BRAIN_STAGES.length;index++){
    const previous=WHOLE_BRAIN_STAGES[index-1],current=WHOLE_BRAIN_STAGES[index];const previousIds=new Set(byStage.get(previous).map(record=>record.id));
    const linked=byStage.get(current).some(record=>(record.predecessorIds||[]).some(id=>previousIds.has(id)));
    if(!linked) throw new Error(`closed loop sequence broken: ${previous} -> ${current}`);
  }
  return Object.freeze({complete:true,correlationId,stages:Object.freeze(Object.fromEntries(WHOLE_BRAIN_STAGES.map(stage=>[stage,true]))),recordIds:Object.freeze(scoped.map(record=>record.id))});
}

export function closedLoopStatus(records,{correlationId}={}){
  try{return assertClosedBrainLoop(records,{correlationId});}catch(error){return Object.freeze({complete:false,correlationId:correlationId||null,error:error.message});}
}
