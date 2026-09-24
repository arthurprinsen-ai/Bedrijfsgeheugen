const validEvidence=record=>Array.isArray(record?.evidenceIds)&&record.evidenceIds.length>0;
const verified=record=>record?.executed===true&&record?.verified===true&&record?.result!==null&&record?.result!==undefined&&record?.result!==''&&validEvidence(record);
const problemId=record=>{
  const candidates=[record?.problemId,record?.problem_id,record?.payload?.problemId,record?.payload?.problem_id,...(Array.isArray(record?.references)?record.references:[])];
  for(const value of candidates){const match=String(value??'').match(/(?:problem:)?(PH-P\d{3})/);if(match)return match[1];}
  return null;
};
const toValue=record=>({id:record.id,subjectId:record.subjectId,problemId:problemId(record),owner:record.owner,result:record.result,evidenceIds:[...record.evidenceIds],realisedValue:Number(record.payload?.realisedValue)||0,valueUnit:record.payload?.valueUnit||'count'});
export function projectVerifiedValue(records){
  const source=Array.isArray(records)?records:[];
  const verifiedValues=source.filter(record=>record?.kind==='value'&&verified(record)&&record.payload?.realised===true).map(toValue);
  const legacyVerifiedOutcomes=source.filter(record=>record?.kind==='outcome'&&verified(record)).map(toValue);
  const totals={};
  const byProblem={};
  for(const item of [...verifiedValues,...legacyVerifiedOutcomes]){
    totals[item.valueUnit]=(totals[item.valueUnit]||0)+item.realisedValue;
    if(!item.problemId) continue;
    if(!byProblem[item.problemId]) byProblem[item.problemId]={problemId:item.problemId,totals:{},evidenceIds:[],records:0};
    byProblem[item.problemId].totals[item.valueUnit]=(byProblem[item.problemId].totals[item.valueUnit]||0)+item.realisedValue;
    byProblem[item.problemId].evidenceIds.push(...item.evidenceIds);
    byProblem[item.problemId].records+=1;
  }
  const verifiedValueByProblem=Object.values(byProblem).map(item=>Object.freeze({...item,evidenceIds:[...new Set(item.evidenceIds)]}));
  return Object.freeze({verifiedValues,legacyVerifiedOutcomes,verifiedOutcomes:legacyVerifiedOutcomes,verifiedValueByProblem,totals});
}
