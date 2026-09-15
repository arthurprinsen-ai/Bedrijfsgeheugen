import { bcgModel, buildBcgAction, bcgInputFromPortalState } from './strategy-models.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const statusText=status=>({idle:'Gereed',dirty:'Niet opgeslagen',saving:'Opslaan…',saved:'Opgeslagen',error:'Opslaan mislukt'})[status]||status||'Gereed';

export function strategyAnalysis(state={}){
 const input=bcgInputFromPortalState(state);const bcg=bcgModel(input);const action=buildBcgAction(input);
 return Object.freeze({bcg,action,notes:String(state?.portal?.strategy?.bcg?.notes||'')});
}

export function mountStrategyWorkspace(root,{view={},domainState,openPage}={}){
 if(!root?.replaceChildren)throw new TypeError('STRATEGY_WORKSPACE_ROOT_REQUIRED');
 let tab='analyse';
 const state=()=>domainState?.get?.()||{};
 const persist=async(path,value)=>{if(!domainState)return;domainState.set(path,value);render();try{await domainState.flush();render();}catch{render();}};
 const addAction=async()=>{
  if(!domainState)return;const analysis=strategyAnalysis(state());if(!analysis.action)return;
  const items=domainState.get('portal.roadmap.items')||[];
  if(items.some(item=>item?.source===analysis.action.source&&item?.title===analysis.action.title)){openPage?.('roadmap');return;}
  const next=[...items,{title:analysis.action.title,dimension:analysis.action.dimension,durationWeeks:analysis.action.durationWeeks,value:analysis.action.value,why:analysis.action.why,source:analysis.action.source,progress:0,done:false,status:'todo',createdFrom:'BCG-matrix'}];
  domainState.set('portal.roadmap.items',next);render();try{await domainState.flush();openPage?.('roadmap');}catch{render();}
 };
 const render=()=>{
  const analysis=strategyAnalysis(state());const {bcg,action}=analysis;
  const quadrants=bcg.quadrants.map(item=>`<article class="v2functional-card" data-bcg-quadrant="${esc(item.key)}" data-active="${item.active}"><h3>${esc(item.label)}</h3><p>${esc(item.interpretation)}</p>${item.active?'<strong>Huidige positie</strong>':''}</article>`).join('');
  const content=tab==='invullen'?`<section class="v2functional-card"><h3>Eigen duiding</h3><label class="v2functional-field"><span>Wat zijn je diensten, en welk vak past bij elk?</span><textarea data-bcg-notes>${esc(analysis.notes)}</textarea></label><p>Marktgroei, eigen volwassenheid en branchebenchmark komen uit dezelfde Powerhouse-state; alleen deze eigen duiding is klantinvoer.</p></section>`:
   tab==='acties'?`<section class="v2functional-card"><h3>Acties</h3>${action?`<p><strong>${esc(action.title)}</strong></p><p>${esc(action.why)}</p><button type="button" class="primary" data-bcg-add-action>Zet in roadmap</button>`:'<p>De actuele BCG-positie vraagt volgens het legacy-model niet om de specifieke Vraagteken-actie.</p>'}</section>`:
   tab==='bewijs'?`<section class="v2functional-card"><h3>Bewijs & herkomst</h3><p><strong>Model:</strong> BCG-matrix · <strong>Bron:</strong> Model BCG</p><p><strong>Regel:</strong> marktgroei &gt; 1,5% = hoge groei; eigen niveau ≥ brancheniveau = sterke positie.</p><p><strong>Authority:</strong> Powerhouse marktdata + maturity; klantduiding: <code>portal.strategy.bcg.notes</code>.</p></section>`:
   `<section class="v2functional-card"><h3>Boston Consulting Group</h3><p>${esc(bcg.explanation)}</p><div class="v2profilemetrics"><article><small>Marktgroei</small><strong>${esc(bcg.marketGrowth.toFixed(1))}%</strong></article><article><small>Eigen niveau</small><strong>${esc(bcg.companyMaturity.toFixed(1))}</strong></article><article><small>Branche</small><strong>${esc(bcg.industryDigitalMaturity.toFixed(1))}</strong></article><article><small>Positie</small><strong>${esc(bcg.quadrant)}</strong></article></div><div class="v2functional-grid">${quadrants}</div></section>`;
  root.innerHTML=`<div class="v2workspace v2workspace-functional" data-workspace="strategie-naar-maandagochtend"><div class="v2workspacebar"><div><span class="v2workspaceeyebrow">Werkruimte</span><strong>${esc(view.title||'Strategie naar maandagochtend')}</strong></div><span class="v2savestatus" data-save-status="${esc(domainState?.status?.()||'idle')}">${esc(statusText(domainState?.status?.()||'idle'))}</span></div><p class="v2workspacedescription">${esc(view.description||'Legacy strategiemodellen met actuele Powerhouse-waarden en uitvoerbare vervolgstappen.')}</p><nav class="v2workspacetabs">${['invullen','analyse','acties','bewijs'].map(item=>`<button type="button" data-strategy-tab="${item}" aria-selected="${item===tab}">${item[0].toUpperCase()+item.slice(1)}</button>`).join('')}</nav>${content}</div>`;
  root.querySelectorAll('[data-strategy-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.strategyTab;render();}));
  root.querySelector('[data-bcg-notes]')?.addEventListener('change',event=>persist('portal.strategy.bcg.notes',event.target.value));
  root.querySelector('[data-bcg-add-action]')?.addEventListener('click',addAction);
 };
 const unsubscribe=domainState?.subscribe?.(()=>render());render();
 return Object.freeze({destroy(){unsubscribe?.();},render});
}
