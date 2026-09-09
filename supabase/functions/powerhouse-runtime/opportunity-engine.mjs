const clamp01=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):0));
const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
const round=value=>Math.round(Number(value)*100)/100;

function fnv1a(value=''){
  let hash=0x811c9dc5;
  for(const char of String(value)){
    hash^=char.charCodeAt(0);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash>>>0;
}

export function normalizeExternalSignal(input={}){
  const source=clean(input.source)||'external';
  const topic=clean(input.topic||input.subject||input.query||input.keyword);
  const audience=clean(input.audience||input.segment||input.persona)||'unknown';
  const observedAt=input.observedAt||input.observed_at||new Date().toISOString();
  const sourceUrl=clean(input.sourceUrl||input.source_url||input.url);
  const context=input.context&&typeof input.context==='object'?input.context:{};
  const features={
    intent:clamp01(input.intent),
    relevance:clamp01(input.relevance),
    urgency:clamp01(input.urgency),
    commercialValue:clamp01(input.commercialValue??input.commercial_value),
    evidenceStrength:clamp01(input.evidenceStrength??input.evidence_strength),
    engagementPotential:clamp01(input.engagementPotential??input.engagement_potential),
    freshness:clamp01(input.freshness),
    sourceDiversity:clamp01(input.sourceDiversity??input.source_diversity),
    customerFit:clamp01(input.customerFit??input.customer_fit),
    saturation:clamp01(input.saturation),
    repetitionRisk:clamp01(input.repetitionRisk??input.repetition_risk),
    searchDemand:clamp01(input.searchDemand??input.search_demand),
    conversationVelocity:clamp01(input.conversationVelocity??input.conversation_velocity),
    depthNeed:clamp01(input.depthNeed??input.depth_need),
    accountSignal:clamp01(input.accountSignal??input.account_signal),
    personContext:Boolean(input.personContext??input.person_context),
    hasExistingContent:Boolean(input.hasExistingContent??input.has_existing_content)
  };
  const identity=[source,sourceUrl,topic,audience,observedAt,clean(context.trigger),clean(context.market)].join('|');
  return Object.freeze({
    signalKey:`signal:${fnv1a(identity).toString(16).padStart(8,'0')}`,
    source,sourceUrl,topic,audience,observedAt,context,features,
    evidence:input.evidence&&typeof input.evidence==='object'?input.evidence:{}
  });
}

const WEIGHTS=Object.freeze({
  commercialValue:18,
  intent:16,
  relevance:14,
  customerFit:12,
  urgency:10,
  evidenceStrength:9,
  freshness:8,
  sourceDiversity:6,
  engagementPotential:4,
  accountSignal:3
});

export function scoreOpportunity(input={}){
  const components={};
  let gross=0;
  for(const [key,weight] of Object.entries(WEIGHTS)){
    const contribution=clamp01(input[key])*weight;
    components[key]=round(contribution);
    gross+=contribution;
  }
  const penalties={
    saturation:round(clamp01(input.saturation)*12),
    repetitionRisk:round(clamp01(input.repetitionRisk??input.repetition_risk)*10)
  };
  const learnedDelta=Math.max(-15,Math.min(15,Number.isFinite(Number(input.learnedDelta))?Number(input.learnedDelta):0));
  const score=Math.max(0,Math.min(100,gross-penalties.saturation-penalties.repetitionRisk+learnedDelta));
  return Object.freeze({score:round(score),components:Object.freeze(components),penalties:Object.freeze(penalties),learnedDelta:round(learnedDelta)});
}

export function chooseOpportunityAction(input={}){
  const score=Number(input.score)||0;
  const intent=clamp01(input.intent);
  const searchDemand=clamp01(input.searchDemand??input.search_demand);
  const conversationVelocity=clamp01(input.conversationVelocity??input.conversation_velocity);
  const depthNeed=clamp01(input.depthNeed??input.depth_need);
  const accountSignal=clamp01(input.accountSignal??input.account_signal);
  const personContext=Boolean(input.personContext??input.person_context);
  const hasExistingContent=Boolean(input.hasExistingContent??input.has_existing_content);
  if(score<60)return Object.freeze({actionType:'observe',channel:'none',reason:'Opportunity score below action threshold.'});
  if(personContext&&accountSignal>=0.75&&intent>=0.7)return Object.freeze({actionType:'sales_follow_up',channel:'direct',reason:'High-intent account/person signal has priority over reach.'});
  if(hasExistingContent&&searchDemand>=0.6)return Object.freeze({actionType:'improve_existing_content',channel:'owned',reason:'Search demand is strong and an existing asset can compound faster.'});
  if(searchDemand>=0.65&&depthNeed>=0.6)return Object.freeze({actionType:'create_blog',channel:'blog',reason:'Search demand plus depth requirement favors a durable long-form asset.'});
  if(conversationVelocity>=0.65)return Object.freeze({actionType:'create_social_post',channel:'social',reason:'Conversation velocity favors timely social participation.'});
  if(depthNeed>=0.65)return Object.freeze({actionType:'create_blog',channel:'blog',reason:'The opportunity needs explanatory depth.'});
  if(score>=70)return Object.freeze({actionType:'create_social_post',channel:'social',reason:'Strong opportunity without long-form depth requirement.'});
  return Object.freeze({actionType:'observe',channel:'none',reason:'Evidence is not decisive enough to publish or sell.'});
}

export function shouldExplore(candidateKey,rate=0.15){
  const bounded=Math.max(0,Math.min(0.25,Number.isFinite(Number(rate))?Number(rate):0.15));
  return (fnv1a(clean(candidateKey))%10000)<Math.round(bounded*10000);
}

export function buildContentBrief(signal,scored,decision,{revenueLearnings=[]}={}){
  const context=signal?.context||{};
  const topLearnings=(Array.isArray(revenueLearnings)?revenueLearnings:[]).slice(0,5).map(item=>({
    learningId:item.learning_id||item.learningId||null,
    claim:item.claim||item.hypothesis||'',
    confidence:Number(item.confidence||0),
    effectSize:Number(item.effect_size??item.effectSize??0)
  }));
  return Object.freeze({
    opportunityKey:`opp:${fnv1a([signal?.topic,signal?.audience,clean(context.market)].join('|')).toString(16).padStart(8,'0')}`,
    topic:signal?.topic||'',
    audience:signal?.audience||'unknown',
    problem:clean(context.problem||context.pain||context.trigger),
    trigger:clean(context.trigger),
    market:clean(context.market),
    score:Number(scored?.score||0),
    actionType:decision?.actionType||'observe',
    angle:clean(context.angle)||'Start from the observed change, connect it to a concrete operational or commercial consequence, then show the next action.',
    proof:signal?.evidence||{},
    cta:clean(context.cta)||((decision?.actionType==='sales_follow_up')?'Start a contextual conversation':'Invite a concrete next step without generic engagement bait.'),
    revenueLearnings:topLearnings
  });
}
