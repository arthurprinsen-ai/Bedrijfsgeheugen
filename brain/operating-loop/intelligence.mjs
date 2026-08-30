const clamp=value=>Math.max(0,Math.min(1,Number(value)||0));

export function prioritizeIntelligence(records,{limit=25}={}){
  const max=Math.max(0,Number(limit)||0);
  return (Array.isArray(records)?records:[])
    .filter(record=>record&&['opportunity','signal'].includes(record.kind))
    .map(record=>{
      const impact=clamp(record.payload?.impact);
      const confidence=clamp(record.payload?.confidence);
      const urgency=clamp(record.payload?.urgency);
      return {
        sourceId:record.id,
        subjectId:record.subjectId,
        owner:record.owner,
        evidenceIds:Array.isArray(record.evidenceIds)?record.evidenceIds.filter(Boolean):[],
        recommendation:record.payload?.recommendation||null,
        impact,
        confidence,
        urgency,
        priorityScore:impact*confidence*urgency
      };
    })
    .filter(item=>item.recommendation&&item.owner&&item.owner!=='UNASSIGNED'&&item.evidenceIds.length>0)
    .sort((a,b)=>b.priorityScore-a.priorityScore||String(a.sourceId).localeCompare(String(b.sourceId)))
    .slice(0,max);
}
