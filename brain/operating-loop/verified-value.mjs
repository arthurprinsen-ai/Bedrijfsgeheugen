const validEvidence=record=>Array.isArray(record?.evidenceIds)&&record.evidenceIds.length>0;
const verified=record=>record?.executed===true&&record?.verified===true&&record?.result!==null&&record?.result!==undefined&&record?.result!==''&&validEvidence(record);
const toValue=record=>({id:record.id,subjectId:record.subjectId,owner:record.owner,result:record.result,evidenceIds:[...record.evidenceIds],realisedValue:Number(record.payload?.realisedValue)||0,valueUnit:record.payload?.valueUnit||'count'});
export function projectVerifiedValue(records){
  const source=Array.isArray(records)?records:[];
  const verifiedValues=source.filter(record=>record?.kind==='value'&&verified(record)&&record.payload?.realised===true).map(toValue);
  const legacyVerifiedOutcomes=source.filter(record=>record?.kind==='outcome'&&verified(record)).map(toValue);
  const totals={};
  for(const item of [...verifiedValues,...legacyVerifiedOutcomes]) totals[item.valueUnit]=(totals[item.valueUnit]||0)+item.realisedValue;
  return Object.freeze({verifiedValues,legacyVerifiedOutcomes,verifiedOutcomes:legacyVerifiedOutcomes,totals});
}
