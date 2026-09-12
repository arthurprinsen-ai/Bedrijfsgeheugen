const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,Number(v)||0));
const pct=v=>clamp(v,0,100)/100;

export function evidenceConvergence(signals=[]){
  const usable=signals.filter(s=>s&&s.quality!==0);
  const independent=new Set(usable.map(s=>String(s.type||'unknown'))).size;
  const weighted=usable.reduce((sum,s)=>sum+clamp(s.quality??s.confidence??.5)*clamp(s.relevance??1),0);
  const score=usable.length?clamp((weighted/usable.length)*Math.min(1,independent/3)):0;
  return {score,independentTypes:independent,count:usable.length};
}

export function latentDemandScore(input={}){
  const problem=pct(input.problemProbability??0);
  const timing=pct(input.timing??0);
  const fit=pct(input.fit??0);
  const warmth=pct(input.relationshipWarmth??0);
  const evidence=clamp(input.evidenceQuality??0);
  const value=Math.max(0,Number(input.expectedValueEur)||0);
  const normalizedValue=Math.min(1,Math.log10(value+1)/5);
  const probability=clamp(problem*.30+timing*.20+fit*.22+warmth*.10+evidence*.18);
  const expectedRevenueValue=Math.round(value*probability*100)/100;
  return {probability,expectedRevenueValue,components:{problem,timing,fit,warmth,evidence,normalizedValue}};
}

export function choosePortfolio(items=[],{explorationRate=.25}={}){
  const rate=clamp(explorationRate,0,.5);
  const ranked=[...items].sort((a,b)=>(Number(b.expectedRevenueValue)||0)-(Number(a.expectedRevenueValue)||0));
  const exploreCount=Math.max(ranked.length?1:0,Math.round(ranked.length*rate));
  const candidates=[...ranked].sort((a,b)=>(Number(b.novelty)||0)-(Number(a.novelty)||0));
  const explore=new Set(candidates.slice(0,exploreCount).map(x=>x.id));
  return ranked.map(x=>({...x,portfolioRole:explore.has(x.id)?'EXPLORE':'EXPLOIT'}));
}

export function counterfactualAssessment({observed=null,baseline=null,confidence=.5}={}){
  if(observed===null||observed===undefined||baseline===null||baseline===undefined)return {status:'INSUFFICIENT_EVIDENCE',incrementalEffect:null,confidence:0};
  const o=Number(observed),b=Number(baseline);
  if(!Number.isFinite(o)||!Number.isFinite(b))return {status:'INSUFFICIENT_EVIDENCE',incrementalEffect:null,confidence:0};
  return {status:'ASSESSED',incrementalEffect:o-b,confidence:clamp(confidence)};
}

export function attributionClass({directKey,assistedKeys=[],evidenceQuality=0}={}){
  if(directKey&&clamp(evidenceQuality)>=.75)return 'DIRECT';
  if((assistedKeys||[]).length&&clamp(evidenceQuality)>=.5)return 'ASSISTED';
  if(directKey||(assistedKeys||[]).length)return 'INFLUENCED';
  return 'UNKNOWN';
}

export function learningLifecycle({status='CANDIDATE',confidence=0,sampleSize=0,contradictions=0,expired=false}={}){
  const c=clamp(confidence),n=Math.max(0,Number(sampleSize)||0),bad=Math.max(0,Number(contradictions)||0);
  if(expired&&c<.7)return 'REVIEW';
  if(status==='RETIRED')return 'RETIRED';
  if(bad>=3||c<.25)return 'RETIRED';
  if(bad>=1||c<.55)return status==='PROVEN'?'WEAKENING':'HOLD';
  if(n>=5&&c>=.75)return 'PROVEN';
  return n>0?'TESTING':'CANDIDATE';
}

export function offerLearning({amount=0,signed=false,weeks=null,components=[]}={}){
  const value=Math.max(0,Number(amount)||0);
  return {fingerprint:`offer:${value>10000?'high':'standard'}:${Array.isArray(components)?components.length:0}`,outcome:signed?'won':'open',revenueEur:signed?value:0,amount:value,weeks:Number.isFinite(Number(weeks))?Number(weeks):null};
}

export function buildPrediction({id,subject,channel='cross_channel',metric='qualified_leads',expectedLift=0,confidence=.5,horizonHours=24,evidenceRefs=[],falsifier='observed effect <= baseline'}={}){
  if(!id||!subject)throw new Error('prediction requires id and subject');
  return {id,subject,channel,metric,expectedLift:Number(expectedLift)||0,confidence:clamp(confidence),horizonHours:Number(horizonHours)||24,evidenceRefs:[...new Set(evidenceRefs.filter(Boolean))],falsifier,recordedBeforeOutcome:true};
}

export function intelligenceScorecard({predictions=[]}={}){
  const evaluated=predictions.filter(p=>Number.isFinite(Number(p.observed))&&Number.isFinite(Number(p.predicted)));
  if(!evaluated.length)return {evaluated:0,mae:null,accuracy:null,falsePositiveRate:null};
  const errors=evaluated.map(p=>Math.abs(Number(p.observed)-Number(p.predicted)));
  const mae=errors.reduce((a,b)=>a+b,0)/errors.length;
  const correct=evaluated.filter(p=>(Number(p.predicted)>0)===(Number(p.observed)>0)).length;
  const positives=evaluated.filter(p=>Number(p.predicted)>0);
  const falsePos=positives.filter(p=>Number(p.observed)<=0).length;
  return {evaluated:evaluated.length,mae,accuracy:correct/evaluated.length,falsePositiveRate:positives.length?falsePos/positives.length:0};
}
