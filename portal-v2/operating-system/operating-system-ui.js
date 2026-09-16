import {CAPABILITIES} from '../capability-catalog.js';
import {normalizeImpact,rankImpact} from './impact-engine.js';
import {createScenario,simulateScenario} from './scenario-engine.js';
import {classifyActionRisk,evaluateActionEligibility} from './action-policy.js';
import {recordDecision,DECISIONS} from './decision-model.js';
import {dedupeSignals} from './monitoring.js';
import {calibrateOutcome,learningExplanation} from './learning.js';
import {buildCapabilityGraph,neighbors} from './capability-graph.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(v)||0);
const stateNow=domainState=>{try{return domainState?.get?.()||{};}catch{return {};}};
function empty(title,copy){return `<section class="os-page-empty"><h3>${esc(title)}</h3><p>${esc(copy)}</p></section>`;}
function items(title,list=[],body=item=>esc(item.title||item.label||item.id)){return `<section class="os-page-card"><h3>${esc(title)}</h3>${list.length?`<div class="os-list">${list.map(item=>`<article>${body(item)}</article>`).join('')}</div>`:'<p class="os-muted">Nog geen bewezen gegevens.</p>'}</section>`;}

function renderImpact(state){
 const raw=state?.powerhouse?.impact||[];if(!Array.isArray(raw)||!raw.length)return empty('Impact','Er is nog geen canonieke impactprojectie beschikbaar. Geschatte waarde wordt niet verzonnen.');
 const cards=raw.map(item=>{let impact;try{impact=normalizeImpact(item);}catch{return `<article><strong>${esc(item.title||item.id)}</strong><p>Impactgegevens onvolledig.</p></article>`;}const ranked=rankImpact(item.ranking||{});return `<article><strong>${esc(item.title||item.id)}</strong><b>${euro(impact.revenue_upside?.amount||impact.cost_capacity_reduction?.amount||0)}</b><small>${esc(impact.revenue_upside?.kind||impact.cost_capacity_reduction?.kind||'onbekend')} · confidence ${Math.round(impact.confidence*100)}% · score ${ranked.score}</small></article>`;});
 return `<section class="os-page-card"><h3>€ Impact Engine</h3><div class="os-impact-grid">${cards.join('')}</div></section>`;
}

function renderScenarios(state,domainState){
 const baseline=state?.powerhouse?.scenario_baseline;if(!baseline)return empty('Scenario Simulator','Nog geen canonieke baseline beschikbaar. Een simulatie overschrijft nooit actuals.');
 const templates=[['Omzet +15%',{revenue_pct:15}],['Capaciteit -10%',{capacity_pct:-10}],['Risico +10',{risk_delta:10}]];
 const buttons=templates.map(([label,assumptions],i)=>`<button type="button" data-os-scenario="${i}">${esc(label)}</button>`).join('');
 return `<section class="os-page-card"><h3>Scenario Simulator</h3><p>Simulaties zijn geïsoleerde overlays op baseline <code>${esc(baseline.id||'actueel')}</code>.</p><div class="os-actions">${buttons}</div><div data-os-scenario-result class="os-scenario-result"></div></section>`;
}

function bindScenarios(root,state){
 const baseline=state?.powerhouse?.scenario_baseline;if(!baseline)return;const assumptions=[{revenue_pct:15},{capacity_pct:-10},{risk_delta:10}];
 root.querySelectorAll('[data-os-scenario]').forEach(btn=>btn.addEventListener('click',()=>{const a=assumptions[Number(btn.dataset.osScenario)];const scenario=createScenario({baselineRef:baseline.id||'current',assumptions:a,affectedCapabilities:baseline.affected_capabilities||[]});const out=simulateScenario(baseline,scenario);const target=root.querySelector('[data-os-scenario-result]');if(target)target.innerHTML=`<strong>Simulatie</strong><pre>${esc(JSON.stringify(out.kpis,null,2))}</pre><small>Actuals zijn niet gewijzigd.</small>`;}));
}

function renderDecisions(state){
 const actions=state?.powerhouse?.executive?.next_best_actions||[];return items('Next Best Actions & besluiten',actions,item=>{const risk=classifyActionRisk(item);const eligibility=evaluateActionEligibility({...item,risk_class:risk},{approved:false,policy_allowed:false});return `<div><strong>${esc(item.title||item.id)}</strong><p>${esc(item.explanation||'')}</p><small>Risicoklasse ${risk} · ${esc(eligibility.state)}</small><div class="os-actions">${DECISIONS.map(d=>`<button type="button" data-os-decision="${esc(d)}" data-action-id="${esc(item.id)}">${esc(d)}</button>`).join('')}</div></div>`;});
}

function bindDecisions(root,domainState,state){
 root.querySelectorAll('[data-os-decision]').forEach(btn=>btn.addEventListener('click',async()=>{if(!domainState?.get||!domainState?.set)return;const actionId=btn.dataset.actionId,decision=btn.dataset.osDecision;const evidence=(state?.powerhouse?.executive?.next_best_actions||[]).find(a=>String(a.id)===actionId)||{};const actor=state?.portal?.user?.id||state?.user?.id||'authenticated-user';const entry=recordDecision({action_id:actionId,decision,actor,evidence_snapshot:{source_refs:evidence.source_refs||[],confidence:evidence.confidence??null}});const current=domainState.get('powerhouse.decisions')||[];domainState.set('powerhouse.decisions',[...current,entry]);await domainState.flush?.();btn.closest('article')?.setAttribute('data-decision-recorded',decision);}));
}

function renderMonitoring(state){const signals=dedupeSignals(state?.powerhouse?.signals||[]);return items('Continuous Monitoring',signals,item=>`<div><strong>${esc(item.title||item.type)}</strong><p>${esc(item.summary||item.entity_id||'')}</p><small>Δ ${esc(item.delta)} · confidence ${Math.round((Number(item.confidence)||0)*100)}%</small></div>`);}
function renderLearning(state){const pairs=state?.powerhouse?.outcome_pairs||[];if(!pairs.length)return empty('Outcomes & Learning','Nog geen expected-vs-realized outcomeparen beschikbaar. Historische evidence blijft ongewijzigd.');return items('Outcomes & Learning',pairs,pair=>{try{const c=calibrateOutcome(pair.expected,pair.realized,pair.history||[]);return `<div><strong>${esc(pair.title||pair.id)}</strong><p>${esc(learningExplanation(c))}</p><small>expected ${esc(c.expected)} · realized ${esc(c.realized)}</small></div>`;}catch{return '<div>Kalibratiegegevens onvolledig.</div>';}});}
function renderEvidence(state){const sources=state?.powerhouse?.sources||[];return items('Data & Evidence Health',sources,s=>`<div><strong>${esc(s.name||s.id)}</strong><p>${esc(s.status||'onbekend')}</p><small>${esc(s.last_successful_sync||'geen syncbewijs')} · confidence ${Math.round((Number(s.confidence)||0)*100)}%</small></div>`);}
function renderGraph(state){const graph=buildCapabilityGraph({capabilities:CAPABILITIES,strategy:state?.powerhouse?.strategy||[],objectives:state?.powerhouse?.objectives||[],actions:state?.powerhouse?.executive?.next_best_actions||[],outcomes:state?.powerhouse?.executive?.outcomes||[]});return `<section class="os-page-card"><h3>Capability Graph</h3><p>${graph.nodes.length} nodes · ${graph.edges.length} verbindingen</p><div class="os-graph-list">${graph.nodes.filter(n=>n.type==='capability').map(n=>`<button type="button" data-os-node="${esc(n.id)}"><strong>${esc(n.label)}</strong><small>${neighbors(graph,n.id).length} relaties</small></button>`).join('')}</div><div data-os-node-detail></div></section>`;}
function bindGraph(root,state){const graph=buildCapabilityGraph({capabilities:CAPABILITIES,strategy:state?.powerhouse?.strategy||[],objectives:state?.powerhouse?.objectives||[],actions:state?.powerhouse?.executive?.next_best_actions||[],outcomes:state?.powerhouse?.executive?.outcomes||[]});root.querySelectorAll('[data-os-node]').forEach(btn=>btn.addEventListener('click',()=>{const ns=neighbors(graph,btn.dataset.osNode);const target=root.querySelector('[data-os-node-detail]');if(target)target.innerHTML=`<h4>Afhankelijkheden</h4><ul>${ns.map(n=>`<li>${esc(n.type)} · ${esc(n.label)}</li>`).join('')}</ul>`;}));}

export const OPERATING_SYSTEM_PAGES=Object.freeze(['impact-engine','scenario-simulator','next-best-actions','monitoring-learning','evidence-health','capability-graph']);

export function mountOperatingSystemPage(root,{pageId,domainState}={}){
 const state=stateNow(domainState);root.innerHTML=pageId==='impact-engine'?renderImpact(state):pageId==='scenario-simulator'?renderScenarios(state,domainState):pageId==='next-best-actions'?renderDecisions(state):pageId==='monitoring-learning'?`${renderMonitoring(state)}${renderLearning(state)}`:pageId==='evidence-health'?renderEvidence(state):pageId==='capability-graph'?renderGraph(state):empty('Powerhouse','Onbekende Operating System-pagina.');
 if(pageId==='scenario-simulator')bindScenarios(root,state);if(pageId==='next-best-actions')bindDecisions(root,domainState,state);if(pageId==='capability-graph')bindGraph(root,state);return true;
}
