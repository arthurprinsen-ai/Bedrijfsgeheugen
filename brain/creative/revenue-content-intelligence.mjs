import {stableIndex,rotateEligible,selectLinkedInEditorialStrategy} from '../../supabase/functions/_shared/linkedin-editorial-strategy.mjs';
export {LINKEDIN_EDITORIAL_PILLARS,LINKEDIN_EDITORIAL_FORMATS,selectLinkedInEditorialStrategy} from '../../supabase/functions/_shared/linkedin-editorial-strategy.mjs';
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
  categoryEntryPointFit:220,
  mentalAvailability:180,
  proofStrength:160,
  salience:130,
  frictionReduction:120,
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
      clamp(signal.categoryEntryPointFit)*weights.categoryEntryPointFit+
      clamp(signal.mentalAvailability)*weights.mentalAvailability+
      clamp(signal.proofStrength)*weights.proofStrength+
      clamp(signal.salience)*weights.salience+
      clamp(signal.frictionReduction)*weights.frictionReduction+
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
const EXPERIMENT_FAMILIES=['standup_recognition','latent_problem_activation','diagnostic_fomo','proof_case','carousel_practical','seo_opportunity','offer_ladder','authority_contrarian','category_entry_point','mental_availability','social_proof','loss_framing','friction_reduction','distinctive_asset'];
const AWARENESS_STAGES=['UNAWARE','PROBLEM_AWARE','SOLUTION_AWARE','PRODUCT_AWARE','MOST_AWARE'];

function needDiscoveryLayer(opportunity={}){
  const fields=[
    ['goal',opportunity.desiredResult||opportunity.goal,'Wat wil je de komende zes maanden concreet verbeteren?'],
    ['situation',opportunity.currentApproach||opportunity.situation,'Hoe regelen jullie dit nu, en met hoeveel mensen?'],
    ['problem',opportunity.problemExample||opportunity.pain,'Wanneer liep dit voor het laatst mis, en wat gebeurde er toen?'],
    ['impact',opportunity.businessImpact||opportunity.impact,'Wat kost dit aan tijd, geld, klanten of afhankelijkheid van jou?'],
    ['urgency',opportunity.urgency,'Waarom wil je dit nu oplossen, en wat gebeurt er als je niets verandert?'],
    ['value',opportunity.successMetric||opportunity.value,'Wat moet er aantoonbaar beter zijn om een investering te rechtvaardigen?'],
    ['decision',opportunity.decisionProcess,'Wie beslist hierover, en wanneer moet een volgende stap duidelijk zijn?']
  ];
  const next=fields.find(([,value])=>!String(value||'').trim());
  const problemConfirmed=Boolean(String(fields[2][1]||'').trim());
  const impactConfirmed=Boolean(String(fields[3][1]||'').trim());
  const urgencyConfirmed=Boolean(String(fields[4][1]||'').trim());
  return {
    discoveryStage:next?.[0]||'complete',
    discoveryQuestion:next?.[2]||'Welke concrete vervolgstap wil je nu afspreken?',
    discoveryObjective:'surface_problem_then_let_audience_or_buyer_articulate_need',
    offerGate:problemConfirmed&&impactConfirmed&&urgencyConfirmed?'qualified_conversation':'discover_before_offer',
    discoveryGuardrail:'engagement_is_interest_not_confirmed_need'
  };
}

function awarenessStage(opportunity={}){
  const explicit=String(opportunity.awarenessStage||'').toUpperCase();
  if(AWARENESS_STAGES.includes(explicit))return explicit;
  if(opportunity.orderIntent||opportunity.offerIntent||opportunity.productAware)return 'PRODUCT_AWARE';
  if(opportunity.solutionIntent||opportunity.comparisonIntent)return 'SOLUTION_AWARE';
  if(opportunity.pain||opportunity.problemAware||opportunity.searchDemand)return 'PROBLEM_AWARE';
  return 'UNAWARE';
}

function buildActivationLayer(identity,opportunity={},channel=''){
  const stage=awarenessStage(opportunity);
  const levers=stage==='UNAWARE'
    ? ['category_entry_point','mental_availability','salience_specificity','unity_identity']
    : stage==='PROBLEM_AWARE'
      ? ['loss_aversion','contrast','social_proof','authority']
      : stage==='SOLUTION_AWARE'
        ? ['social_proof','authority','friction_reduction','reciprocity_value_first']
        : ['social_proof','friction_reduction','commitment_consistency','truthful_scarcity'];
  const behavioralLever=levers[stableIndex(`${identity}:behavior`,levers.length)];
  return {
    awarenessStage:stage,
    behavioralLever,
    categoryEntryPoint:opportunity.buyingSituation||opportunity.categoryEntryPoint||opportunity.triggerSituation||opportunity.pain||opportunity.topic||'hidden_business_friction',
    mentalAvailabilityCue:opportunity.distinctiveCue||'bedrijfskennis_uit_hoofden_in_het_bedrijf',
    proofRequirement:['social_proof','authority','truthful_scarcity'].includes(behavioralLever)?'verifiable_evidence_required':'evidence_preferred',
    persuasionGuardrails:['no_fake_scarcity','no_fake_social_proof','no_fabricated_authority','no_deceptive_dark_patterns','no_manufactured_fear','make_claims_specific_and_verifiable'],
    activationObjective:stage==='UNAWARE'?'recognize_buying_situation':stage==='PROBLEM_AWARE'?'name_cost_and_consequence':stage==='SOLUTION_AWARE'?'reduce_uncertainty_and_show_path':'reduce_friction_to_next_step',
    channelRole:channel==='blog'?'capture_and_expand_demand':channel==='linkedin_personal'?'create_recognition_and_conversation':'build_memory_proof_and_demand'
  };
}

// Personal editorial experiments are recommendations only: never a source or send permit.
export const PERSONAL_GROWTH_METHODS=Object.freeze(['concrete_detail','source_led_structure','natural_reflection','verified_contrarian_view','practical_explanation','evidence_led_insight','design_tradeoff','lesson_from_verified_experience','source_led_question']);
const COMPANY_CONTENT_FAMILIES=Object.freeze(['checklist','diagnostic','worked_example','evidence_benchmark','verified_case','myth_vs_fact','how_to','comparison','original_research','industry_explainer','template','product_education']);
// Options are hypotheses, not permission to use a format or claim. Source/asset gates remain independent.
export function selectCompanyContentVariation({seed='',recentFormats=[],recentFamilies=[],eligibleFormats=COMPANY_FORMATS,eligibleFamilies=[]}={}){
 const formats=COMPANY_FORMATS.filter(x=>Array.isArray(eligibleFormats)&&eligibleFormats.includes(x));
 const families=COMPANY_CONTENT_FAMILIES.filter(x=>Array.isArray(eligibleFamilies)&&eligibleFamilies.includes(x));
 return {format:formats.length?rotateEligible(formats,recentFormats,seed):null,
  family:families.length?rotateEligible(families,recentFamilies,seed+':family'):null,
  decision:'SOURCE_AND_FORMAT_ELIGIBILITY_REQUIRED',authorizesPublication:false,causalLiftProven:false};
}

export function selectPersonalGrowthMethod({mode='EXPLORE',seed='',cohortId='',observations=[],recentMethods=[],eligibleMethods=PERSONAL_GROWTH_METHODS}={}){
  const allowed=PERSONAL_GROWTH_METHODS.filter(x=>Array.isArray(eligibleMethods)&&eligibleMethods.includes(x));
  const history=Array.isArray(recentMethods)?recentMethods.filter(x=>PERSONAL_GROWTH_METHODS.includes(x)).slice(0,6):[];
  const fallback=()=>({method:allowed.length?rotateEligible(allowed,history,seed):null,decision:'CONTROLLED_EXPLORATION',measurement:'NOT_MEASURED',authorizesPublication:false});
  if(!allowed.length)return fallback();
  if(mode!=='EXPLOIT'||!String(cohortId).trim()||!Array.isArray(observations))return fallback();
  const seen=new Set(), duplicate=new Set(), valid=[];
  for(const row of observations){
    if(!row||row.channel!=='linkedin_personal'||row.cohortId!==cohortId||row.format!=='text_story'||row.windowHours!==48||row.providerReadbackVerified!==true||!PERSONAL_GROWTH_METHODS.includes(row.method)||!/^urn:li:(share|ugcPost):[0-9]+$/.test(String(row.providerPostId||''))||!Number.isInteger(row.impressions)||row.impressions<=0||!Number.isInteger(row.substantiveComments)||row.substantiveComments<0)continue;
    if(seen.has(row.providerPostId))duplicate.add(row.providerPostId);
    seen.add(row.providerPostId); valid.push(row);
  }
  const comparable=allowed.map(method=>{
    const rows=valid.filter(row=>row.method===method&&!duplicate.has(row.providerPostId));
    return {method,sample:rows.length,rate:rows.length?rows.reduce((sum,row)=>sum+row.substantiveComments/row.impressions,0)/rows.length:null};
  }).filter(group=>group.sample>=5).sort((a,b)=>b.rate-a.rate);
  if(comparable.length<2||comparable[0].rate-comparable[1].rate<=0.001)return fallback();
  if(history[0]===comparable[0].method&&history[1]===comparable[0].method&&allowed.some(x=>x!==comparable[0].method))return {...fallback(),decision:'DIVERSITY_CHALLENGER'};
  return {method:comparable[0].method,decision:'OBSERVATIONAL_CANDIDATE',measurement:'COMPARABLE_48H_PERSONAL_POSTS',comparison:comparable,authorizesPublication:false,causalLiftProven:false};
}

export function buildCreativeRecipe({channel,opportunity={},mode='EXPLORE',seed='',personalGrowthEvidence={},companyContentEvidence={}}={}){
  const identity=`${seed}:${opportunity.topic||''}:${opportunity.pain||''}:${mode}`;
  const discovery=needDiscoveryLayer(opportunity);
  if(channel==='linkedin_personal'){
    // Editorial recipe is never a provider permit. Only the original personal
    // source + last-metre gates may authorize a genuine, user-confirmed event.
    // Never recycle a commercial opportunity into Arthur's personal story.
    return {
      channel,
      mode,
      textType:'verified_first_person_personal_life_story',
      format:'text_story',
      sourceContract:'personal-linkedin-personal-life-only-v1',
      sourceStatus:'VERIFIED_UNUSED_USER_FACT_REQUIRED',
      requiresVerifiedUserFact:true,
      requiresUserApprovalForPrivateDetails:true,
      requiresIndependentFinalReview:true,
      semanticStoryFamilyUniquenessRequired:true,
      publicationDays:'monday_to_saturday',
      // The actual verified event determines voice and structure. Never rotate
      // cosmetic joke/emotion/CTA templates as though they were personal facts.
      narrativeShape:'source_determined',
      styleContract:'declutter_complexity_source_led_non_template',
      mandatoryHook:false,
      mandatoryTwist:false,
      mandatoryHumor:false,
      mandatoryQuestion:false,
      mandatoryMoral:false,
      questionAllowedOnlyIfNatural:true,
      lengthPolicy:'only_as_long_as_the_event_needs',
      compareRecentPostsFor:['opening','narrative_arc','length','humor','ending'],
      objective:'authentic_personal_conversation',
      editorialStrategy:selectLinkedInEditorialStrategy({...personalGrowthEvidence?.editorialStrategy,channel:'linkedin_personal',seed}),
      personalGrowthHypothesis:selectPersonalGrowthMethod({mode,seed,cohortId:personalGrowthEvidence?.cohortId,observations:personalGrowthEvidence?.observations,recentMethods:personalGrowthEvidence?.recentMethods,eligibleMethods:personalGrowthEvidence?.eligibleMethods}),
      // Business radar opportunities are not evidence of Arthur's life.
      topic:null,
      guardrails:[
        'no_fabricated_story','no_public_news_fallback','no_business_bridge',
        'no_recycled_story_family','no_private_chat_as_public_permission',
        'no_sales_cta','no_unverified_personal_details',
        'no_repeated_storytelling_template','no_forced_lesson_or_question'
      ]
    };
  }
  if(channel==='blog'){
    return {
      channel,
      mode,
      ...discovery,
      ...buildActivationLayer(identity,opportunity,channel),
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
  const variation=selectCompanyContentVariation({seed:identity,...companyContentEvidence});
  return {
    channel:channel||'linkedin_company',
    mode,
    ...discovery,
    ...buildActivationLayer(identity,opportunity,channel||'linkedin_company'),
    textType:'proof_led_business_education',
    format:variation.format,
    contentVariation:variation,
    ...(channel==='linkedin_company'||!channel?{editorialStrategy:selectLinkedInEditorialStrategy({...companyContentEvidence?.editorialStrategy,channel:'linkedin_company',seed})}:{}),
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
