const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):0;
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(num(value));
const latest=(...values)=>values.flat().filter(Boolean).map(String).sort().pop()||'';

export const COMPANY_INTELLIGENCE_SURFACES=Object.freeze([
  'executive-cockpit','impact-engine','next-best-actions','roadmap','monitoring-learning','evidence-health','company-graph'
]);

export function buildCompanyIntelligenceContext(runtime={},surface='executive-cockpit'){
  const graphNodes=arr(runtime?.datahub?.items);
  const graphEdges=num(runtime?.datahub?.edges);
  const decisions=arr(runtime?.decisions?.items);
  const actions=arr(runtime?.actions?.items);
  const outcomes=arr(runtime?.outcomes?.items);
  const learning=arr(runtime?.learning?.items);
  const approvals=arr(runtime?.approvals?.items);
  const portfolio=runtime?.portfolio&&typeof runtime.portfolio==='object'?runtime.portfolio:{NOW:[],NEXT:[]};
  const economics=runtime?.economics||{};
  const observedAt=latest(runtime?.datahub?.updatedAt,runtime?.decisions?.updatedAt,runtime?.actions?.updatedAt,runtime?.outcomes?.updatedAt,runtime?.learning?.updatedAt);
  const focus={
    'executive-cockpit':arr(portfolio.NOW).slice(0,3),
    'impact-engine':decisions.filter(item=>num(item.expectedValue)>0).slice(0,3),
    'next-best-actions':decisions.filter(item=>['NOW','NEXT'].includes(item?.portfolioBucket)).slice(0,3),
    roadmap:[...arr(portfolio.NOW),...arr(portfolio.NEXT)].slice(0,3),
    'monitoring-learning':learning.slice(0,3),
    'evidence-health':outcomes.slice(0,3),
    'company-graph':graphNodes.slice(0,5)
  }[surface]||[];
  const proven=Boolean(graphNodes.length||decisions.length||actions.length||outcomes.length||learning.length);
  return Object.freeze({
    surface,proven,observedAt,
    graph:Object.freeze({nodes:graphNodes.length,edges:graphEdges}),
    context:Object.freeze({decisions:decisions.length,now:arr(portfolio.NOW).length,next:arr(portfolio.NEXT).length,approvals:approvals.length}),
    action:Object.freeze({items:actions.slice(0,3),count:actions.length}),
    outcome:Object.freeze({items:outcomes.slice(0,3),count:outcomes.length,realizedValue:num(economics.realizedValue)}),
    learning:Object.freeze({items:learning.slice(0,3),count:learning.length}),
    focus
  });
}

function itemTitle(item={}){return item.title||item.naam||item.label||item.subjectId||item.id||'Context';}
function itemReason(item={}){return arr(item.reasons).join(' · ')||item.nextAction||item.status||item.reason||'';}

export function renderCompanyIntelligenceContext(runtime={},surface='executive-cockpit'){
  const model=buildCompanyIntelligenceContext(runtime,surface);
  if(!model.proven)return '<section class="ci-context ci-context-empty" data-company-intelligence-context="'+esc(surface)+'"><div><span>Powerhouse intelligence</span><strong>Nog geen bewezen context</strong></div><p>Deze visualisatie blijft leeg totdat tenant-scoped runtime-evidence beschikbaar is.</p></section>';
  const focus=model.focus.length?model.focus.map(item=>'<article><strong>'+esc(itemTitle(item))+'</strong><small>'+esc(itemReason(item)||'Herleidbaar uit de actuele bedrijfscontext')+'</small></article>').join(''):'<article><strong>Geen extra focus nodig</strong><small>Er is voor deze context geen aanvullende bewezen prioriteit.</small></article>';
  return '<section class="ci-context" data-company-intelligence-context="'+esc(surface)+'">'
    +'<header><div><span>Powerhouse intelligence</span><h3>Wat zien we → wat doen we → wat leren we?</h3></div><small>'+(model.observedAt?'Bijgewerkt '+esc(model.observedAt):'Actuele runtime')+'</small></header>'
    +'<div class="ci-loop" aria-label="Company Intelligence feedbackloop">'
      +'<article><i>1</i><span>Context</span><b>'+model.graph.nodes+'</b><small>graph-nodes · '+model.graph.edges+' relaties</small></article>'
      +'<article><i>2</i><span>Besluiten</span><b>'+model.context.decisions+'</b><small>'+model.context.now+' nu · '+model.context.approvals+' goedkeuring</small></article>'
      +'<article><i>3</i><span>Acties</span><b>'+model.action.count+'</b><small>volgende uitvoerbare stappen</small></article>'
      +'<article><i>4</i><span>Uitkomsten</span><b>'+model.outcome.count+'</b><small>'+euro(model.outcome.realizedValue)+' gerealiseerde waarde</small></article>'
      +'<article><i>5</i><span>Leren</span><b>'+model.learning.count+'</b><small>herbruikbare learnings</small></article>'
    +'</div>'
    +'<div class="ci-focus"><div class="ci-focus-head"><strong>Relevant op deze plek</strong><span>'+esc(surface)+'</span></div>'+focus+'</div>'
    +'<details><summary>Waarom laat Powerhouse dit zien?</summary><p>Dit is geen losse AI-score. De visualisatie projecteert alleen tenant-scoped graph-, besluit-, actie-, outcome- en learning-evidence uit dezelfde canonieke runtime. Ontbrekende evidence wordt niet ingevuld of geschat.</p></details>'
  +'</section>';
}
