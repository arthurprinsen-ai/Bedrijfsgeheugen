const clean=(value,max=500)=>String(value??'').replace(/[\r\n\t]+/g,' ').trim().slice(0,max);
const finite=value=>Number.isFinite(Number(value))?Number(value):null;

export const NEED_DISCOVERY_STAGES=Object.freeze([
  Object.freeze({key:'goal',label:'Gewenst resultaat',field:'desired_result',question:'Wat wil je de komende zes maanden concreet verbeteren?'}),
  Object.freeze({key:'situation',label:'Huidige situatie',field:'current_approach',question:'Hoe regelen jullie dit nu, en met hoeveel mensen?'}),
  Object.freeze({key:'problem',label:'Bevestigd probleem',field:'problem_example',question:'Wanneer liep dit voor het laatst mis, en wat gebeurde er toen?'}),
  Object.freeze({key:'impact',label:'Zakelijke impact',field:'business_impact',question:'Wat kost dit aan tijd, geld, klanten of afhankelijkheid van jou?'}),
  Object.freeze({key:'urgency',label:'Urgentie',field:'urgency',question:'Waarom wil je dit nu oplossen, en wat gebeurt er als je niets verandert?'}),
  Object.freeze({key:'value',label:'Gewenste waarde',field:'success_metric',question:'Wat moet er aantoonbaar beter zijn om een investering te rechtvaardigen?'}),
  Object.freeze({key:'decision',label:'Besluitvorming',field:'decision_process',question:'Wie beslist hierover, en wanneer moet een volgende stap duidelijk zijn?'})
]);

const aliases=Object.freeze({
  desired_result:['desired_result','goal','result','objective'],
  current_approach:['current_approach','situation','current_process'],
  problem_example:['problem_example','problem','pain','last_incident'],
  business_impact:['business_impact','impact','cost','hours_lost'],
  urgency:['urgency','why_now','deadline'],
  success_metric:['success_metric','value','desired_value'],
  decision_process:['decision_process','decision_maker','budget_process']
});

export function normalizeNeedAnswers(input={}){
  const normalized={};
  for(const [field,keys] of Object.entries(aliases)){
    const value=keys.map(key=>input?.[key]).find(item=>clean(item));
    normalized[field]=clean(value);
  }
  normalized.employee_count=finite(input?.employee_count);
  normalized.solution_cadence=['one_time','continuous','unknown'].includes(clean(input?.solution_cadence))
    ? clean(input.solution_cadence):'unknown';
  return normalized;
}

export function deriveNeedProfile(input={}){
  const answers=normalizeNeedAnswers(input);
  const missing=NEED_DISCOVERY_STAGES.find(stage=>!answers[stage.field])||null;
  const completed=NEED_DISCOVERY_STAGES.filter(stage=>Boolean(answers[stage.field])).length;
  const problemConfirmed=Boolean(answers.problem_example);
  const impactConfirmed=Boolean(answers.business_impact);
  const urgencyConfirmed=Boolean(answers.urgency);
  const decisionReady=Boolean(answers.decision_process);
  const readiness=completed/NEED_DISCOVERY_STAGES.length;
  const offerEligibility=!problemConfirmed?'discover':!impactConfirmed?'diagnose':!urgencyConfirmed?'develop_need':decisionReady?'proposal_ready':'qualified_conversation';
  const recommendedOffer=offerEligibility==='proposal_ready'
    ? (answers.solution_cadence==='continuous'?'portal':'frisse_blik_scan')
    : offerEligibility==='qualified_conversation'?'frisse_blik'
    :'no_offer_yet';
  return Object.freeze({
    contract:'powerhouse-need-discovery-v1',
    answers,
    completed,
    readiness,
    stage:missing?.key||'complete',
    stageLabel:missing?.label||'Expliciete behoefte',
    nextQuestion:missing?.question||'Welke concrete vervolgstap wil je nu afspreken?',
    problemConfirmed,
    impactConfirmed,
    urgencyConfirmed,
    decisionReady,
    offerEligibility,
    recommendedOffer,
    mayPitch:['qualified_conversation','proposal_ready'].includes(offerEligibility)
  });
}

export function buildNeedDiscoveryContext(input={},channel='website'){
  const profile=deriveNeedProfile(input);
  const role=channel==='linkedin_company'||channel==='blog'||channel==='instagram_company'
    ? 'surface_a_recognizable_problem_and_invite_self_diagnosis'
    : channel==='email'||channel==='linkedin_dm'
      ? 'ask_one_contextual_question_and_wait_for_the_answer'
      : channel==='portal'
        ? 'show_confirmed_need_impact_urgency_owner_and_next_step'
        : 'progressive_discovery';
  return Object.freeze({
    ...profile,
    channel,
    channelRole:role,
    singleQuestion:true,
    evidenceRule:'unknown stays unknown; never infer pain, impact, urgency, budget or authority from engagement alone',
    outcomePath:Object.freeze(['reply','confirmed_problem','confirmed_impact','qualified_conversation','meeting','scan','proposal','paid_order','realized_revenue'])
  });
}
