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

export function offerLearning({amount=0,signed=false,weeks=null,components=[],recognizedRevenueEur=null}={}){
  const value=Math.max(0,Number(amount)||0);
  const recognized=recognizedRevenueEur===null||recognizedRevenueEur===undefined?0:Math.max(0,Number(recognizedRevenueEur)||0);
  return {fingerprint:`offer:${value>10000?'high':'standard'}:${Array.isArray(components)?components.length:0}`,
    outcome:signed?'accepted':'open',orderValueEur:signed?value:0,revenueEur:recognized,amount:value,weeks:Number.isFinite(Number(weeks))?Number(weeks):null};
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

const keySlug=value=>String(value||'unknown').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96)||'unknown';

export function buildRelationshipRecord({fromType,fromKey,toType,toKey,relation,confidence=.5,evidenceRefs=[],observedAt=new Date().toISOString(),reviewAt=null}={}){
  if(!fromType||!fromKey||!toType||!toKey||!relation)throw new Error('relationship requires source, target and relation');
  const from={type:String(fromType),key:String(fromKey)},to={type:String(toType),key:String(toKey)};
  const recordId=`relation:${keySlug(from.type)}:${keySlug(from.key)}:${keySlug(relation)}:${keySlug(to.type)}:${keySlug(to.key)}`;
  const refs=[...new Set((evidenceRefs||[]).filter(Boolean).map(String))];
  return {tenant_id:'canonical',record_id:recordId,record_type:'Relation',record_kind:'relation',subject_id:`${from.type}:${keySlug(from.key)}`,status:'VERIFIED',observed_at:observedAt,executed:true,verified:true,result:{state:'RELATION_OBSERVED',relation:String(relation)},evidence_ids:refs,provenance:{runtime:'growth-intelligence-v2'},payload:{from,to,relation:String(relation),confidence:clamp(confidence),review_at:reviewAt},idempotency_key:recordId,source_revision:'growth-intelligence-v2',updated_at:observedAt};
}

export function companyIntelligenceProfile({company,connection=null,engagementEvents=[],externalSignals=[],now=new Date().toISOString()}={}){
  if(!company)throw new Error('company required');
  const name=String(company),needle=name.toLowerCase();
  const events=(engagementEvents||[]).filter(e=>String(e?.company_name||'').toLowerCase()===needle);
  const matched=(externalSignals||[]).filter(s=>[s?.titel,s?.samenvatting,s?.onderwerp,s?.domein].filter(Boolean).join(' ').toLowerCase().includes(needle));
  const text=matched.map(s=>[s.titel,s.samenvatting,s.onderwerp].filter(Boolean).join(' ')).join(' | ');
  const hiring=/vacatur|werft|hiring|hire|recruit|data engineer|ai engineer/i.test(text)?matched.map(s=>s.titel||s.url).filter(Boolean):[];
  const technology=/microsoft|fabric|power bi|afas|sap|dynamics|ai|data|cloud/i.test(text)?matched.map(s=>s.titel||s.url).filter(Boolean):[];
  const refs=[...new Set([...events.map(e=>e.event_key),...matched.map(s=>s.url),connection?.linkedin_url?`connection:${connection.linkedin_url}`:null].filter(Boolean))];
  return {company:name,observed:{role:connection?.rol||null,connectionPriority:Number(connection?.prioriteit)||0,engagementCount:events.length,externalSignalCount:matched.length},inferred:{hiringSignals:hiring,technologySignals:technology,capabilityGapCandidate:Boolean(hiring.length||technology.length)&&events.length>0},sourceRefs:refs,observedAt:now};
}

export function whitespaceScore({searchDemand=0,observedSupply=0,evidenceQuality=0,commercialFit=0}={}){
  const demand=pct(searchDemand),supply=pct(observedSupply),quality=clamp(evidenceQuality),fit=clamp(commercialFit);
  const score=clamp(demand*.4+(1-supply)*.3+quality*.15+fit*.15);
  return {score,components:{demand,supply,quality,fit}};
}

export function calibratePrediction({predictedProbability,observedBinary,baseline=null}={}){
  if(predictedProbability===null||predictedProbability===undefined||observedBinary===null||observedBinary===undefined)return {status:'INSUFFICIENT_EVIDENCE',brierScore:null,absoluteError:null,classification:null,counterfactualStatus:'INSUFFICIENT_EVIDENCE'};
  const predicted=clamp(predictedProbability),observed=Number(observedBinary)>0?1:0;
  const brierScore=(predicted-observed)**2,absoluteError=Math.abs(predicted-observed),positive=predicted>=.5;
  const classification=positive?(observed?'TRUE_POSITIVE':'FALSE_POSITIVE'):(observed?'FALSE_NEGATIVE':'TRUE_NEGATIVE');
  const cf=counterfactualAssessment({observed,baseline,confidence:1});
  return {status:'EVALUATED',predicted,observed,brierScore,absoluteError,classification,counterfactualStatus:cf.status,incrementalEffect:cf.incrementalEffect};
}

export function decayConfidence({confidence=0,lastValidatedAt=null,now=new Date().toISOString(),halfLifeDays=90}={}){
  const base=clamp(confidence),half=Math.max(1,Number(halfLifeDays)||90);
  if(!lastValidatedAt)return {confidence:base,ageDays:null,reviewRequired:true};
  const ageDays=Math.max(0,(new Date(now).getTime()-new Date(lastValidatedAt).getTime())/86400000);
  if(!Number.isFinite(ageDays))return {confidence:base,ageDays:null,reviewRequired:true};
  const effective=clamp(base*Math.pow(.5,ageDays/half));
  return {confidence:effective,ageDays,reviewRequired:ageDays>=half||effective<.55};
}

export function attributionSummary({growthOutcomes=[],salesOutcomes=[]}={}){
  const merged=new Map();
  const put=(key,row,kind)=>{if(!key)return;const current=merged.get(key)||{revenue:0,order:0,klass:'UNKNOWN'};const evidence=row?.payload||row?.evidence||{};current.revenue=Math.max(current.revenue,Math.max(0,Number(row?.revenue_eur)||0));current.order=Math.max(current.order,Math.max(0,Number(evidence.order_value_eur??evidence.orderValueEur)||0));current.klass=String(evidence.attribution_class||evidence.attributionClass||current.klass||'UNKNOWN').toUpperCase();current.kind=kind;merged.set(key,current);};
  for(const o of growthOutcomes||[])put(o.attribution_root_key||o.outcome_id,o,'growth');
  for(const o of salesOutcomes||[])put(o.attribution_root_key||o.dedupe_key||o.outcome_id||o.action_id,o,'sales');
  const counts={DIRECT:0,ASSISTED:0,INFLUENCED:0,UNKNOWN:0};let realizedRevenueEur=0,orderValueEur=0;
  for(const x of merged.values()){realizedRevenueEur+=x.revenue;orderValueEur+=x.order;counts[x.klass in counts?x.klass:'UNKNOWN']++;}
  return {realizedRevenueEur:Math.round(realizedRevenueEur*100)/100,orderValueEur:Math.round(orderValueEur*100)/100,counts,uniqueOutcomes:merged.size};
}
