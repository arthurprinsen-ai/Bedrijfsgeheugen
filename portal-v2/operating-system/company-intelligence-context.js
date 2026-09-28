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
function buildGraph({problem,opportunity,action,outcome}){
  const nodes=[];const edges=[];const seen=new Set();
  const add=(id,type,label)=>{id=txt(id);if(!id||seen.has(id))return;seen.add(id);nodes.push({id,type,label:txt(label||id)});};
  arr(problem?.source_refs||problem?.evidence_refs||problem?.evidenceIds).slice(0,3).forEach((id,index)=>add(`source:${id}`,'bron',txt(id)||`Bron ${index+1}`));
  arr(problem?.capabilities).slice(0,2).forEach(id=>add(`capability:${id}`,'capability',id));
  if(problem){const id=`problem:${txt(problem.problem_id||problem.id||'current')}`;add(id,'signaal',title(problem,'Aandachtspunt'));nodes.filter(n=>n.type==='bron'||n.type==='capability').forEach(n=>edges.push({from:n.id,to:id}));}
  if(opportunity){const id=`opportunity:${txt(opportunity.id||opportunity.title||'current')}`;add(id,'kans',title(opportunity,'Kans'));const from=nodes.find(n=>n.type==='signaal')?.id;if(from)edges.push({from,to:id});}
  if(action){const id=`action:${txt(action.id||action.title||'current')}`;add(id,'actie',title(action,'Actie'));const from=[...nodes].reverse().find(n=>['kans','signaal'].includes(n.type))?.id;if(from)edges.push({from,to:id});}
  if(outcome){const id=`outcome:${txt(outcome.id||outcome.subjectId||outcome.title||'current')}`;add(id,'outcome',title(outcome,'Uitkomst'));const from=[...nodes].reverse().find(n=>n.type==='actie')?.id;if(from)edges.push({from,to:id});}
  return {nodes,edges};
}
export function buildCompanyIntelligenceContext(input={},surface='executive-cockpit'){
  const {executive,outcomePairs}=normalize(input);
  const problem=first(executive?.problems);
  const opportunity=first(executive?.opportunities);
  const change=first(executive?.changes)||first(executive?.forecasts);
  const action=first(executive?.next_best_actions);
  const outcome=first(executive?.outcomes);
  const pair=first(outcomePairs);
  const signal=problem||change||opportunity;
  const graph=buildGraph({problem,opportunity,action,outcome});
  const expected=pair?.expected?.value??pair?.expected??action?.expected_value??action?.expectedValue;
  const realized=pair?.realized?.value??pair?.realized??outcome?.value??outcome?.realized_value;
  const learning=txt(pair?.learning||pair?.explanation||pair?.lesson||outcome?.learning);
  return Object.freeze({surface,signal,problem,opportunity,change,action,outcome,pair,graph,expected,realized,learning,available:Boolean(signal||action||outcome||graph.nodes.length)});
}
function stage(icon,label,item,copy){return `<article class="ci-stage"><span>${icon}</span><small>${esc(label)}</small><strong>${esc(title(item,copy))}</strong><em>${item?esc(evidenceLabel(item)):'nog geen bewezen context'}</em></article>`;}
export function renderCompanyIntelligenceContext(input={},surface='executive-cockpit'){
  const model=buildCompanyIntelligenceContext(input,surface);
  if(!model.available)return '<section class="ci-context ci-context-empty" data-company-intelligence-context data-context-surface="'+esc(surface)+'"><div><small>Powerhouse Intelligence</small><strong>Nog onvoldoende bewezen context</strong><p>Zodra tenant-scoped bewijs beschikbaar is, verschijnt hier de keten van signaal naar besluit, actie, resultaat en learning.</p></div></section>';
  const graph=model.graph.nodes.length?`<div class="ci-mini-graph" aria-label="Company Graph context">${model.graph.nodes.map(node=>`<span data-node-type="${esc(node.type)}"><i></i><b>${esc(node.label)}</b><small>${esc(node.type)}</small></span>`).join('<em>→</em>')}</div>`:'';
  const memory=(model.outcome||model.pair)?`<div class="ci-memory"><div><small>Outcome Memory</small><strong>${model.realized==null?'Resultaat vastgelegd':euro(model.realized)}</strong></div><p>${model.expected==null?'Verwachting blijft gescheiden van gerealiseerde waarde.':`Verwacht ${euro(model.expected)} → gerealiseerd ${model.realized==null?'nog niet bewezen':euro(model.realized)}.`}</p>${model.learning?`<p><b>Geleerd:</b> ${esc(model.learning)}</p>`:''}</div>`:'';
  return `<section class="ci-context" data-company-intelligence-context data-context-surface="${esc(surface)}">
    <div class="ci-head"><div><small>Powerhouse Intelligence</small><h3>Powerhouse ziet nu</h3><p>Wat zien we → waarom telt het → wat doen we → wat kwam eruit → wat leren we.</p></div><span>tenant-scoped</span></div>
    <div class="ci-stages">
      ${stage('◎','Ziet',model.signal,'Nog geen bewezen signaal')}
      ${stage('⌘','Begrijpt',model.problem||model.opportunity,'Nog geen bewezen context')}
      ${stage('✦','Beslist',model.action,'Nog geen bewezen besluit')}
      ${stage('▶','Doet',model.action,'Nog geen actie')}
      ${stage('↺','Leert',model.outcome||model.pair,'Nog geen geverifieerde uitkomst')}
    </div>
    ${graph}${memory}
  </section>`;
}
