function uniqueIds(values=[]){return [...new Set((Array.isArray(values)?values:[]).map(String).filter(Boolean))].sort();}

export function buildSelectionRecord({date,selected,mode='brain_learning',selectedAt=new Date().toISOString()}={}){
  if(!date||!selected?.content_id||!selected?.slug)throw new TypeError('CONTENT_SELECTION_REQUIRED');
  const applied=uniqueIds(selected.applied_revenue_learning_ids);
  return {
    date,
    content_id:selected.content_id,
    slug:selected.slug,
    state:'selected',
    selected_at:selectedAt,
    selection_mode:mode,
    selection_score:Number(selected.score||0),
    learning_decision_id:`content:${date}:${selected.content_id}`,
    applied_revenue_learning_ids:applied,
  };
}

export async function reconcileLearningApplications({ledger,store,now=new Date()}={}){
  if(!ledger?.days||!store?.recordDecision||!store?.recordApplication)throw new TypeError('LEARNING_RECONCILE_DEPENDENCIES_REQUIRED');
  let decisions=0,applications=0;
  const cutoff=new Date(now.getTime()-14*86400000);
  for(const [date,record] of Object.entries(ledger.days)){
    if(!record?.content_id||!record?.learning_decision_id)continue;
    const day=new Date(`${date}T00:00:00Z`);if(Number.isFinite(day.getTime())&&day<cutoff)continue;
    const ids=uniqueIds(record.applied_revenue_learning_ids);
    await store.recordDecision({decisionId:record.learning_decision_id,contentId:record.content_id,channel:'blog',businessDate:date,slug:record.slug||null,selectionMode:record.selection_mode||'brain_learning',score:Number(record.selection_score||0),appliedLearningIds:ids,recordedAt:record.selected_at||now.toISOString()});
    decisions++;
    for(const learningId of ids){
      await store.recordApplication({applicationId:`${record.learning_decision_id}:${learningId}`,contentId:record.content_id,channel:'blog',learningId,decisionId:record.learning_decision_id,appliedAt:record.selected_at||now.toISOString(),applicationRole:'PRIMARY',verificationStatus:'PENDING'});
      applications++;
    }
  }
  return {decisions,applications};
}
