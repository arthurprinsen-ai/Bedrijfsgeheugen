const n=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,n(value)));

const DEFAULT_WEIGHTS={
  expectedRevenue:1,
  intent:1500,
  urgency:700,
  evidence:500,
  painActivation:350,
  fomo:250,
  strategicFit:300,
  learningValue:180,
  reachLog:15
};

export function rankOpportunities(signals=[],policy={}){
  const weights={...DEFAULT_WEIGHTS,...(policy.weights||{})};
  return [...signals].map(signal=>{
    const reach=Math.max(0,n(signal.reach));
    const opportunityScore=
      Math.max(0,n(signal.expectedRevenue))*weights.expectedRevenue+
      clamp(signal.intent)*weights.intent+
      clamp(signal.urgency)*weights.urgency+
      clamp(signal.evidence)*weights.evidence+
      clamp(signal.painActivation)*weights.painActivation+
      clamp(signal.fomo)*weights.fomo+
      clamp(signal.strategicFit)*weights.strategicFit+
      clamp(signal.learningValue)*weights.learningValue+
      Math.log10(reach+1)*weights.reachLog;
    return {...signal,opportunityScore};
  }).sort((a,b)=>b.opportunityScore-a.opportunityScore);
}

export function chooseDecisionMode(history=[],explorationTarget=.2){
  const target=clamp(explorationTarget);
  if(!history.length)return 'EXPLORE';
  const explored=history.filter(value=>value==='EXPLORE').length;
  return explored/history.length<target?'EXPLORE':'EXPLOIT';
}

const COMEDY_DEVICES=['observational_contrast','understatement','rule_of_three','self_deprecation','exaggeration','callback'];
const EMOTIONS=['recognition_then_relief','amused_frustration','productive_discomfort','ambition','fear_of_dependency','relief'];
const COMPANY_FORMATS=['carousel','case_proof','diagnostic'];
const EXPERIMENT_FAMILIES=['standup_recognition','latent_problem_activation','diagnostic_fomo','proof_case','carousel_practical','seo_opportunity','offer_ladder','authority_contrarian'];

function stableIndex(value,length){
  const text=String(value||'');
  let hash=0;
  for(const char of text)hash=(hash*31+char.charCodeAt(0))>>>0;
  return length?hash%length:0;
}

export function buildCreativeRecipe({channel,opportunity={},mode='EXPLORE',seed=''}={}){
  const identity=`${seed}:${opportunity.topic||''}:${opportunity.pain||''}:${mode}`;
  if(channel==='linkedin_personal'){
    return {
      channel,
      mode,
      textType:'observational_business_standup',
      format:'text_story',
      comedyDevice:COMEDY_DEVICES[stableIndex(identity,COMEDY_DEVICES.length)],
      emotion:EMOTIONS[stableIndex(`${identity}:emotion`,EMOTIONS.length)],
      painTrigger:opportunity.pain||'hidden_operational_friction',
      fomoTrigger:'hidden_cost_of_waiting',
      proofType:'lived_observation',
      ctaType:'conversation_question',
      offerType:'conversation_to_diagnostic',
      objective:'commercial_conversation',
      topic:opportunity.topic||null,
      guardrails:['no_fabricated_story','no_manufactured_outrage','no_generic_ai_slogan','no_repetitive_cta']
    };
  }
  if(channel==='blog'){
    return {
      channel,
      mode,
      textType:'search_demand_to_problem_activation',
      format:'seo_article',
      emotion:'productive_discomfort',
      painTrigger:opportunity.pain||'unpriced_problem',
      fomoTrigger:'competitor_or_cost_of_delay',
      proofType:'benchmark_or_case',
      ctaType:'diagnostic_offer',
      offerType:'frisse_blik_to_scan',
      objective:'organic_qualified_demand',
      topic:opportunity.topic||null
    };
  }
  return {
    channel:channel||'linkedin_company',
    mode,
    textType:'proof_led_business_education',
    format:COMPANY_FORMATS[stableIndex(identity,COMPANY_FORMATS.length)],
    emotion:'productive_discomfort',
    painTrigger:opportunity.pain||'hidden_business_risk',
    fomoTrigger:'cost_of_inaction',
    proofType:'case_or_benchmark',
    ctaType:'diagnostic_offer',
    offerType:'frisse_blik_or_scan',
    objective:'qualified_demand',
    topic:opportunity.topic||null
  };
}

function isoDate(date){return date.toISOString().slice(0,10);}

export function buildExperimentCalendar({start,end}={}){
  const first=new Date(`${start}T00:00:00Z`);
  const last=new Date(`${end}T00:00:00Z`);
  if(!Number.isFinite(first.getTime())||!Number.isFinite(last.getTime())||first>last)return [];
  const rows=[];
  for(let cursor=new Date(first),i=0;cursor<=last;cursor=new Date(cursor.getTime()+86400000),i++){
    const date=isoDate(cursor);
    const experimentFamily=EXPERIMENT_FAMILIES[i%EXPERIMENT_FAMILIES.length];
    const mode=i%5===0?'EXPLORE':'EXPLOIT';
    const opportunity={topic:experimentFamily.replaceAll('_',' ')};
    rows.push({
      date,
      experimentId:`rci-${date}`,
      experimentFamily,
      mode,
      sourceSignals:['social_learning','revenue_learning','seo_growth','site_analytics','network_relationships','sales_outcomes'],
      personal:buildCreativeRecipe({channel:'linkedin_personal',opportunity,mode,seed:date}),
      company:buildCreativeRecipe({channel:'linkedin_company',opportunity,mode,seed:date}),
      blog:buildCreativeRecipe({channel:'blog',opportunity,mode,seed:date}),
      copyPolicy:'generate_near_publish_from_latest_learning'
    });
  }
  return rows;
}
