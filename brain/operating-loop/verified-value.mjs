export function projectVerifiedValue(records){
  const verifiedOutcomes=(Array.isArray(records)?records:[])
    .filter(record=>record?.kind==='outcome'&&record.executed===true&&record.verified===true&&record.result!==null&&record.result!==undefined&&record.result!==''&&Array.isArray(record.evidenceIds)&&record.evidenceIds.length>0)
    .map(record=>({id:record.id,subjectId:record.subjectId,owner:record.owner,result:record.result,evidenceIds:[...record.evidenceIds],realisedValue:Number(record.payload?.realisedValue)||0,valueUnit:record.payload?.valueUnit||'count'}));
  const totals={};
  for(const outcome of verifiedOutcomes) totals[outcome.valueUnit]=(totals[outcome.valueUnit]||0)+outcome.realisedValue;
  return Object.freeze({verifiedOutcomes,totals});
}
