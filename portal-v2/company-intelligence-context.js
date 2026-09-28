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
    graph:Object.freeze({nodes:graphNodes.length,edges:graphEdges,items:graphNodes.slice(0,5)}),
    context:Object.freeze({decisions:decisions.length,now:arr(portfolio.NOW).length,next:arr(portfolio.NEXT).length,approvals:approvals.length}),
    action:Object.freeze({items:actions.slice(0,3),count:actions.length}),
    outcome:Object.freeze({items:outcomes.slice(0,3),count:outcomes.length,realizedValue:num(economics.realizedValue)}),
    learning:Object.freeze({items:learning.slice(0,3),count:learning.length}),
    focus
  });
}

function itemTitle(item={}){return item.title||item.naam||item.label||item.subjectId||item.id||'Context';}
function itemReason(item={}){return arr(item.reasons).join(' · ')||item.nextAction||item.status||item.reason||'';}
function stage(icon,label,value,detail){return '<article class="ci-stage"><span>'+icon+'</span><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><em>'+esc(detail)+'</em></article>';}

export function renderCompanyIntelligenceContext(runtime={},surface='executive-cockpit'){
  const model=buildCompanyIntelligenceContext(runtime,surface);
  if(!model.proven)return '<section class="ci-context ci-context-empty" data-company-intelligence-context="'+esc(surface)+'"><div class="ci-head"><div><small>Powerhouse intelligence</small><h3>Nog geen bewezen context</h3><p>Deze visualisatie blijft leeg totdat tenant-scoped runtime-evidence beschikbaar is.</p></div><span>'+esc(surface)+'</span></div></section>';
  const graphItems=(model.graph.items.length?model.graph.items:model.focus).slice(0,5);
  const graph=graphItems.length?'<div class="ci-mini-graph" aria-label="Relevante Company Graph context">'+graphItems.map((item,index)=>'<span><i></i><b>'+esc(itemTitle(item))+'</b><small>'+esc(item.status||item.portfolioBucket||'context')+'</small></span>'+(index<graphItems.length-1?'<em>→</em>':'')).join('')+'</div>':'';
  const memory=model.learning.items[0];
  const memoryMarkup='<div class="ci-memory"><div><strong>Outcome memory & learning</strong><small>'+model.learning.count+' learning'+(model.learning.count===1?'':'s')+'</small></div><p>'+(memory?esc(itemTitle(memory)+(itemReason(memory)?' · '+itemReason(memory):'')):'Nog geen geverifieerde learning voor deze context.')+'</p></div>';
  return '<section class="ci-context" data-company-intelligence-context="'+esc(surface)+'">'
    +'<div class="ci-head"><div><small>Powerhouse intelligence</small><h3>Wat zien we → waarom → actie → resultaat → leren</h3><p>Dezelfde tenant-scoped Company Intelligence-context, visueel vertaald naar wat hier relevant is.</p></div><span>'+esc(surface)+'</span></div>'
    +'<div class="ci-stages">'
      +stage('◎','Context',model.graph.nodes+' nodes',model.graph.edges+' relaties')
      +stage('✦','Besluiten',String(model.context.decisions),model.context.now+' nu · '+model.context.approvals+' goedkeuring')
      +stage('⚡','Acties',String(model.action.count),'volgende uitvoerbare stappen')
      +stage('✓','Uitkomsten',String(model.outcome.count),euro(model.outcome.realizedValue)+' gerealiseerd')
      +stage('↺','Leren',String(model.learning.count),'wijzigt volgende beslissingen')
    +'</div>'+graph+memoryMarkup
    +'<details><summary>Waarom laat Powerhouse dit zien?</summary><p>Dit is geen losse AI-score. Alleen tenant-scoped graph-, besluit-, actie-, outcome- en learning-evidence uit de canonieke runtime wordt geprojecteerd. Ontbrekende evidence wordt niet ingevuld of geschat.</p></details>'
  +'</section>';
}
