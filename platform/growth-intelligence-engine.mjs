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

const MKB_TRIGGER_RULES=Object.freeze([
  {type:'rapid_growth',pattern:/\b(groei|groeit|uitbreid|opschal|scale|nieuwe vestiging|extra vestiging)\w*/i,problemHypothesis:'De organisatie, informatievoorziening en verantwoordelijkheden kunnen achterlopen op de groei.',recommendedOffer:'Frisse Blik groei & grip',partnerChannels:['accountant','bank','branchevereniging']},
  {type:'leadership_change',pattern:/\b(nieuwe|benoemd|aangesteld)\b.{0,40}\b(ceo|cfo|coo|directeur|directie)\b|\b(ceo|cfo|coo|directeur)\b.{0,40}\b(benoemd|aangesteld)\b/i,problemHypothesis:'Nieuwe leiding heeft snel een betrouwbaar beeld nodig van prestaties, risico’s, processen en afhankelijkheden.',recommendedOffer:'Frisse Blik directie-start',partnerChannels:['investeerder','accountant','bank']},
  {type:'acquisition_integration',pattern:/\b(overname|acquisitie|fusie|merger|acquisition|neemt .{0,30} over|gekocht)\b/i,problemHypothesis:'Na een overname kunnen processen, KPI’s, systemen en verantwoordelijkheden naast elkaar blijven bestaan.',recommendedOffer:'Frisse Blik overname & integratie',partnerChannels:['m&a-adviseur','investeerder','accountant']},
  {type:'sale_succession',pattern:/\b(verkoopklaar|bedrijfsverkoop|opvolging|succession|familiebedrijf|exit)\b/i,problemHypothesis:'Voor verkoop of opvolging moet bedrijfskennis overdraagbaar, aantoonbaar en minder persoonsafhankelijk worden.',recommendedOffer:'Frisse Blik verkoopklaar',partnerChannels:['m&a-adviseur','accountant','investeerder']},
  {type:'investor_financing',pattern:/\b(investeerder|private equity|participatie|financiering|funding|kapitaal)\b/i,problemHypothesis:'Nieuwe financiering of aandeelhouders verhogen de behoefte aan transparantie, voortgang en bestuurbare KPI’s.',recommendedOffer:'Frisse Blik investor readiness',partnerChannels:['investeerder','bank','accountant']},
  {type:'erp_or_system_change',pattern:/\b(afas|sap|dynamics(?: 365)?|erp|systeemmigratie|implementatie|migratie)\b/i,problemHypothesis:'Een systeemverandering legt proces-, datakwaliteits- en eigenaarschapsproblemen bloot.',recommendedOffer:'Frisse Blik processen & data',partnerChannels:['erp-afas-partner','msp-it-partner','accountant']},
  {type:'margin_or_turnaround',pattern:/\b(marge|kostenbesparing|verlies|winstdruk|turnaround|reorganisatie|herstructur|faillissement)\w*/i,problemHypothesis:'Druk op marge of continuïteit vraagt om snel inzicht in verspilling, oorzaken, cash-impact en uitvoerbare verbeteracties.',recommendedOffer:'Frisse Blik turnaround & rendement',partnerChannels:['accountant','bank','bedrijfsadviseur']},
  {type:'staffing_pressure',pattern:/\b(personeelstekort|arbeidsmarkt|vacatur|werft|hiring|recruit)\w*/i,problemHypothesis:'Personeelsdruk vergroot de waarde van processtandaardisatie, kennisborging en gerichte automatisering.',recommendedOffer:'Frisse Blik capaciteit & automatisering',partnerChannels:['branchevereniging','accountant','msp-it-partner']},
  {type:'regulatory_change',pattern:/\b(ai act|csrd|nis2|avg|gdpr|wetgeving|regelgeving|compliance)\b/i,problemHypothesis:'Nieuwe regelgeving vraagt aantoonbare processen, eigenaarschap, data en beheersmaatregelen.',recommendedOffer:'Frisse Blik risico & compliance',partnerChannels:['accountant','branchevereniging','bedrijfsadviseur']},
  {type:'ai_data_adoption',pattern:/\b(kunstmatige intelligentie|artificial intelligence|\bai\b|power bi|microsoft fabric|analytics|dataplatform|data platform)\b/i,problemHypothesis:'AI- of data-ambitie levert pas waarde wanneer processen, data, eigenaarschap en concrete use-cases voldoende volwassen zijn.',recommendedOffer:'Frisse Blik AI & data',partnerChannels:['msp-it-partner','erp-afas-partner','branchevereniging']}
]);

export function classifyMkbBuyingTriggers({company,externalSignals=[],connection=null,engagementEvents=[]}={}){
  if(!company)return {status:'INSUFFICIENT_EVIDENCE',triggers:[],score:0,evidenceRefs:[],problemHypotheses:[],recommendedOffers:[],partnerChannels:[],outreachMode:'context-led'};
  const needle=String(company).trim().toLowerCase();
  const matched=(externalSignals||[]).filter(s=>[s?.titel,s?.samenvatting,s?.onderwerp,s?.domein].filter(Boolean).join(' ').toLowerCase().includes(needle));
  const found=[];
  for(const rule of MKB_TRIGGER_RULES){
    const evidence=matched.filter(s=>rule.pattern.test([s?.titel,s?.samenvatting,s?.onderwerp].filter(Boolean).join(' ')));
    if(!evidence.length)continue;
    const confidence=evidence.reduce((sum,s)=>sum+clamp((Number(s?.vertrouwen??s?.brontrouw??50)||50)/100),0)/evidence.length;
    found.push({type:rule.type,confidence,problemHypothesis:rule.problemHypothesis,recommendedOffer:rule.recommendedOffer,partnerChannels:rule.partnerChannels,evidenceRefs:[...new Set(evidence.map(s=>s?.url).filter(Boolean))]});
  }
  const refs=[...new Set(found.flatMap(x=>x.evidenceRefs))];
  if(!found.length)return {status:'INSUFFICIENT_EVIDENCE',triggers:[],score:0,evidenceRefs:[],problemHypotheses:[],recommendedOffers:[],partnerChannels:[],outreachMode:'context-led'};
  const engagementCount=(engagementEvents||[]).filter(e=>String(e?.company_name||'').trim().toLowerCase()===needle).length;
  const relationship=connection?Math.min(1,(Number(connection?.prioriteit)||50)/100):0;
  const base=found.reduce((m,x)=>Math.max(m,x.confidence),0);
  const score=clamp(base*.75+Math.min(1,engagementCount/5)*.15+relationship*.10);
  return {
    status:'EVIDENCE_BACKED',
    triggers:found.sort((a,b)=>b.confidence-a.confidence),
    score,
    evidenceRefs:refs,
    problemHypotheses:[...new Set(found.map(x=>x.problemHypothesis))],
    recommendedOffers:[...new Set(found.map(x=>x.recommendedOffer))],
    partnerChannels:[...new Set(found.flatMap(x=>x.partnerChannels))],
    outreachMode:'context-led'
  };
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
