import {verifiedCustomerOutcome} from './outcome-feedback.js';
const arr=value=>Array.isArray(value)?value:[];
const txt=value=>String(value??'').trim();
const esc=value=>txt(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);

function normalize(input={}){
  if(input?.portal?.runtime) return normalize(input.portal.runtime);
  if(input?.available!==undefined&&Array.isArray(input?.next_best_actions)) return {executive:input,outcomePairs:arr(input.outcome_pairs),runtime:null};
  if(input?.decisions?.items||input?.outcomes?.items) return {executive:{problems:[],opportunities:[],changes:[],forecasts:[],next_best_actions:arr(input?.decisions?.items),outcomes:arr(input?.outcomes?.items)},outcomePairs:arr(input?.learning?.items),runtime:input};
  return {executive:input?.powerhouse?.executive||input?.executive||{},outcomePairs:arr(input?.powerhouse?.outcome_pairs||input?.outcome_pairs),runtime:null};
}
function first(items){return arr(items).find(Boolean)||null;}
function title(item,fallback){return txt(item?.title||item?.label||item?.name||item?.problem_id||item?.id||fallback);}
function confidence(item){const value=Number(item?.confidence??item?.evidence_health?.confidence);return Number.isFinite(value)?Math.max(0,Math.min(1,value)):null;}
function evidenceLabel(item){const status=txt(item?.evidence_health?.status||item?.evidence_status);if(status)return status;const c=confidence(item);return c==null?'bewijs onbekend':`${Math.round(c*100)}% confidence`;}
// An edge is causal evidence, not merely the position of two cards in a list.
// The original authenticated runtime supplies identities; never join first items.
const same=(a,b)=>Boolean(txt(a)&&txt(b)&&txt(a)===txt(b));
const refs=value=>arr(value).filter(v=>typeof v==='string'&&v.trim());
const amount=value=>value===null||value===undefined||typeof value==='boolean'||value===''||!Number.isFinite(Number(value))?null:Number(value);
function buildGraph({problem,opportunity,action,outcome}){
 const nodes=[],edges=[],seen=new Set();
 const add=(id,type,label)=>{id=txt(id);if(!id||seen.has(id))return;seen.add(id);nodes.push({id,type,label:txt(label||id)});};
 const problemId=txt(problem?.problem_id||problem?.id);
 const opportunityId=txt(opportunity?.id),actionId=txt(action?.id);
 refs(problem?.source_refs||problem?.evidence_refs||problem?.evidenceIds).slice(0,3)
  .forEach((id,index)=>add('source:'+id,'bron',txt(id)||'Bron '+(index+1)));
 arr(problem?.capabilities).slice(0,2).forEach(id=>add('capability:'+id,'capability',id));
 if(problemId){const id='problem:'+problemId;add(id,'signaal',title(problem,'Aandachtspunt'));
  nodes.filter(n=>n.type==='bron'||n.type==='capability').forEach(n=>edges.push({from:n.id,to:id}));}
 if(opportunityId){add('opportunity:'+opportunityId,'kans',title(opportunity,'Kans'));
  if(same(opportunity?.problem_id,problemId))edges.push({from:'problem:'+problemId,to:'opportunity:'+opportunityId});}
 if(actionId){add('action:'+actionId,'actie',title(action,'Actie'));
  if(same(action?.opportunity_id,opportunityId))edges.push({from:'opportunity:'+opportunityId,to:'action:'+actionId});
  else if(same(action?.problem_id,problemId))edges.push({from:'problem:'+problemId,to:'action:'+actionId});}
 if(outcome&&actionId&&same(outcome.action_id||outcome.source_action_id,actionId)){
  const outcomeId=txt(outcome.id||outcome.outcome_id);
  if(outcomeId){add('outcome:'+outcomeId,'outcome',title(outcome,'Uitkomst'));
   edges.push({from:'action:'+actionId,to:'outcome:'+outcomeId});}
 }
 return {nodes,edges};
}

export function buildCompanyIntelligenceContext(input={},surface='executive-cockpit'){
  const {executive,outcomePairs}=normalize(input);
  const problem=first(executive?.problems);
  const opportunity=first(executive?.opportunities);
  const change=first(executive?.changes)||first(executive?.forecasts);
  const action=first(executive?.next_best_actions);
  const allOutcomes=arr(executive?.outcomes);
  // Reuse the exact verified-outcome gate from the ORIGINAL Outcome Feedback.
  // A matching action ID, healthy independent source refs, typed amount, metric,
  // baseline and period must ALL exist before displaying realized company value.
  const outcome=allOutcomes.find(item=>verifiedCustomerOutcome(item)&&same(item.action_id||item.source_action_id,action?.id))||null;
  const pair=outcome?outcomePairs.find(item=>
    same(item?.action_id,action?.id)&&same(item?.outcome_id,outcome?.id||outcome?.outcome_id)
    &&item?.learning_verified===true&&refs(item?.learning_evidence_refs).length>0
    &&txt(item?.next_decision_id||item?.next_decision))||null:null;
  const signal=problem||change||opportunity;
  const graph=buildGraph({problem,opportunity,action,outcome});
  const impact=action?.expected_impact||action?.expectedImpact;
  const expected=action?.evidence_health?.status==='healthy'&&refs(action?.source_refs).length
    &&['estimated','forecast','assumption','derived'].includes(txt(impact?.kind).toLowerCase())
    &&['EUR','HOURS','COUNT','PERCENT'].includes(txt(impact?.unit).toUpperCase())
    ?amount(impact?.amount):null;
  const expectedUnit=expected!==null?txt(impact?.unit).toUpperCase():null;
  const actual=outcome?.realized||{};
  const realized=outcome?amount(actual.amount??outcome?.realized_amount):null;
  const realizedUnit=outcome?txt(actual.unit||outcome?.realized_unit).toUpperCase():null;
  const verifiedLearning=outcome?.learning_verified===true
   &&refs(outcome?.learning_evidence_refs).length>0
   &&txt(outcome?.next_decision_id||outcome?.next_decision);
  const learning=pair?txt(pair.learning||pair.explanation||pair.lesson):verifiedLearning?
    txt(outcome?.learning_summary||outcome?.learning_title||outcome?.learning):'';
  return Object.freeze({surface,signal,problem,opportunity,change,action,outcome,pair,graph,
    expected,expectedUnit,realized,realizedUnit,learning,
    hasUnverifiedOutcome:allOutcomes.length>0&&!outcome,
    available:Boolean(signal||action||outcome||graph.nodes.length)});
}
function stage(icon,label,item,copy){return `<article class="ci-stage"><span>${icon}</span><small>${esc(label)}</small><strong>${esc(title(item,copy))}</strong><em>${item?esc(evidenceLabel(item)):'nog geen bewezen context'}</em></article>`;}
export function renderCompanyIntelligenceContext(input={},surface='executive-cockpit'){
  const model=buildCompanyIntelligenceContext(input,surface);
  if(!model.available)return '<section class="ci-context ci-context-empty" data-company-intelligence-context data-context-surface="'+esc(surface)+'"><div><small>Powerhouse Intelligence</small><strong>Nog onvoldoende bewezen context</strong><p>Zodra tenant-scoped bewijs beschikbaar is, verschijnt hier de keten van signaal naar besluit, actie, resultaat en learning.</p></div></section>';
  // Only show graph arrows for explicit matching IDs. Unrelated nodes may
  // appear in the five-stage overview but never as a fabricated causal chain.
  const nodeById=new Map(model.graph.nodes.map(node=>[node.id,node]));
  const graph=model.graph.edges.length?`<div class="ci-mini-graph" aria-label="Aantoonbare Company Graph relaties">${model.graph.edges.map(edge=>{
    const from=nodeById.get(edge.from),to=nodeById.get(edge.to);
    return from&&to?`<span data-node-type="${esc(from.type)}"><b>${esc(from.label)}</b></span><em>→</em><span data-node-type="${esc(to.type)}"><b>${esc(to.label)}</b></span>`:'';
  }).join('')}</div>`:'';
  const verifiedValue=model.realized==null?'Nog niet bewezen':
    model.realizedUnit==='EUR'?euro(model.realized):esc(String(model.realized)+' '+model.realizedUnit);
  const expectedValue=model.expected==null?'Verwachting nog niet onderbouwd':
    model.expectedUnit==='EUR'?euro(model.expected):esc(String(model.expected)+' '+model.expectedUnit);
  const memory=(model.outcome||model.hasUnverifiedOutcome)?`<div class="ci-memory" data-outcome-proof="${model.outcome?'verified':'evidence-due'}"><div><small>Outcome Memory</small><strong>${verifiedValue}</strong></div>
    <p>Verwacht ${expectedValue} → werkelijk resultaat ${verifiedValue}. Een bronstatus, interne actie of concept is geen bedrijfsresultaat.</p>
    ${model.learning?`<p><b>Geleerd en gekoppeld:</b> ${esc(model.learning)}</p>`:'<p>Leereffect nog niet onafhankelijk aangetoond.</p>'}</div>`:'';

  return `<section class="ci-context" data-company-intelligence-context data-context-surface="${esc(surface)}">
    <div class="ci-head"><div><small>Powerhouse Intelligence</small><h3>Powerhouse ziet nu</h3><p>Wat zien we → waarom telt het → wat doen we → wat kwam eruit → wat leren we.</p></div><span>tenant-scoped</span></div>
    <div class="ci-stages">
      ${stage('◎','Ziet',model.signal,'Nog geen bewezen signaal')}
      ${stage('⌘','Begrijpt',model.problem||model.opportunity,'Nog geen bewezen context')}
      ${stage('✦','Beslist',model.action,'Nog geen bewezen besluit')}
      ${stage('▶','Doet',model.outcome?model.action:null,'Uitvoering nog niet aangetoond')}
      ${stage('↺','Leert',model.learning?model.outcome:null,'Leereffect nog niet bewezen')}
    </div>
    ${graph}${memory}
  </section>`;
}
