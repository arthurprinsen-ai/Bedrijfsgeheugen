import {
  buildStrategicModels, STRATEGIC_MODEL_IDS, buildStrategicRoadmapAction, mergeStrategicRoadmapAction,
  buildBcgModel, buildBcgRoadmapAction, mergeBcgRoadmapAction
} from '../strategic-models.js';
import { calculateLegacyEquivalent } from '../legacy-parity-engine.js';
import { calculateLegacyFinanceModels } from '../legacy-finance-models.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function modelMarkup(model,editable=false){
  const isBcg=model.id==='bcg';
  const body=isBcg?`<div class="bcg-grid">${model.quadrants.map(q=>`<article class="bcg-quadrant${q.current?' current':''}" data-quadrant="${esc(q.id)}"><b>${esc(q.label)}</b><p>${esc(q.description)}</p>${q.current?'<strong>Huidige positie</strong>':''}</article>`).join('')}</div>`:`<div class="v2reviewlist"><article><div><small>Signaal</small><b>${esc(model.signal||'Geen signaal')}</b></div><strong>${esc(model.source)}</strong></article><article><div><small>Bewijsbasis</small><b>${esc(model.evidence)}</b></div><strong>Powerhouse</strong></article></div>`;
  const edit=editable?`<label><span>${esc(model.prompt)}</span><textarea rows="3" data-model-note="${esc(model.id)}" ${isBcg?'data-bcg-note':''}>${esc(model.note)}</textarea></label>`:'';
  return `<section class="strategic-model${isBcg?' bcg-model':''}" data-model-id="${esc(model.id)}"><header><small>${esc(model.source)}</small><h3>${esc(model.title)}</h3><p>${esc(model.explanation)}</p></header>${body}<section class="model-conclusion"><b>Conclusie</b><p>${esc(model.conclusion)}</p></section>${edit}</section>`;
}


const FINANCE_MODEL_CATALOG=Object.freeze([
  Object.freeze({id:'ebitda-multiple',title:'EBITDA-multiple',source:'Waarde & financiering'}),
  Object.freeze({id:'ebitda-margin',title:'Margegat met de branche',source:'Cijfers & maatstaven'}),
  Object.freeze({id:'solvency',title:'Solvabiliteit',source:'Waarde & financiering'}),
  Object.freeze({id:'dscr',title:'Rentedekking (DSCR)',source:'Waarde & financiering'}),
  Object.freeze({id:'dupont',title:'DuPont',source:'Waarde & financiering'}),
  Object.freeze({id:'altman-z',title:'Altman Z',source:'Waarde & financiering'}),
  Object.freeze({id:'break-even',title:'Break-even',source:'Waarde & financiering'}),
  Object.freeze({id:'working-capital-days',title:'Werkkapitaalcyclus',source:'Cijfers & financiering'})
]);
const nlValue=(value,digits=1)=>Number.isFinite(Number(value))?Number(value).toLocaleString('nl-NL',{maximumFractionDigits:digits,minimumFractionDigits:digits}):'—';
function financeResult(id,state){
  const finance=calculateLegacyFinanceModels(state);
  if(id==='solvency')return {value:`${nlValue(finance.solvency)}%`,evidence:'Eigen vermogen ÷ balanstotaal'};
  if(id==='working-capital-days')return {value:`${nlValue(finance['working-capital-days'],0)} dagen`,evidence:'Debiteurendagen + voorraaddagen − crediteurendagen'};
  if(id==='dupont'){
    const value=calculateLegacyEquivalent('dupont-breakdown',state);
    return {value:`ROE ${nlValue(value?.roe)}%`,evidence:`Nettomarge ${nlValue(value?.netMargin)}% × omloopsnelheid ${nlValue(value?.assetTurnover)} × hefboom ${nlValue(value?.leverage)}`};
  }
  const calculator=id==='ebitda-multiple'?'ebitda-multiple':id;
  const value=calculateLegacyEquivalent(calculator,state);
  const suffix=id==='ebitda-multiple'?'×':id==='ebitda-margin'?'%':id==='dscr'?'×':id==='break-even'?'':'';
  const evidence={
    'ebitda-multiple':'EBITDA-multiple uit de canonieke financieringsinvoer',
    'ebitda-margin':'EBITDA ÷ omzet',
    dscr:'EBITDA ÷ rente en aflossingslast',
    'altman-z':'Altman Z op balans-, omzet- en EBITDA-input',
    'break-even':'Vaste kosten ÷ brutomarge'
  }[id]||'Legacy finance calculator';
  return {value:`${nlValue(value)}${suffix}`,evidence};
}
function financeMarkup(item,state){
  const result=financeResult(item.id,state);
  return `<section class="strategic-model finance-model" data-model-id="${esc(item.id)}"><header><small>${esc(item.source)}</small><h3>${esc(item.title)}</h3><p>Hetzelfde financiële model als in het oude portaal, berekend op de canonieke V2-klantstate.</p></header><div class="v2reviewlist"><article><div><small>Uitkomst</small><b>${esc(result.value)}</b></div><strong>Legacy parity</strong></article><article><div><small>Rekenbasis</small><b>${esc(result.evidence)}</b></div><strong>Powerhouse</strong></article></div><section class="model-conclusion"><b>Verder werken</b><p>De invoer en verdiepende financiële context staan onder Waarde en financiering.</p><button type="button" class="pvprimary" data-open-page="waarde-financiering">Open waarde en financiering →</button></section></section>`;
}
function modelCatalog(models,includeFinance){
  const strategic=models.map(model=>`<button type="button" data-model-jump="${esc(model.id)}"><span>${esc(model.title)}</span><i>→</i></button>`).join('');
  const finance=includeFinance?FINANCE_MODEL_CATALOG.map(model=>`<button type="button" data-model-jump="${esc(model.id)}"><span>${esc(model.title)}</span><i>→</i></button>`).join(''):'';
  return `<section class="model-catalog" data-model-catalog><div class="pvmodulehead"><span>01</span><h3>Strategische modellen · ${models.length}</h3></div><div class="pvactions model-catalog-actions">${strategic}</div>${includeFinance?`<div class="pvmodulehead"><span>02</span><h3>Financiële modellen · ${FINANCE_MODEL_CATALOG.length}</h3></div><div class="pvactions model-catalog-actions">${finance}</div><p class="sub" data-model-catalog-count>Alle ${models.length+FINANCE_MODEL_CATALOG.length} modellen uit het oude portaal zijn hier als afzonderlijke front-end bestemming aanwezig.</p>`:''}</section>`;
}
function bindModelNavigation(root,openPage){
  root.querySelectorAll('[data-model-jump]').forEach(button=>button.addEventListener('click',()=>{
    const target=root.querySelector(`[data-model-id="${button.dataset.modelJump}"]`);
    if(!target)return;
    target.scrollIntoView?.({behavior:'smooth',block:'start'});
    target.setAttribute('tabindex','-1');
    target.focus?.({preventScroll:true});
  }));
  root.querySelectorAll('[data-open-page]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.openPage)));
}

function roadmapActionFor(model){return model.id==='bcg'?buildBcgRoadmapAction(model):buildStrategicRoadmapAction(model)}
function mergeRoadmapFor(state,model){return model.id==='bcg'?mergeBcgRoadmapAction(state,buildBcgRoadmapAction(buildBcgModel(state))):mergeStrategicRoadmapAction(state,buildStrategicRoadmapAction(model))}

export function mountStrategicModelWorkspace(root,{domainState,openPage,shell,onSaveStatus}={}){
  if(!root?.replaceChildren)throw new TypeError('STRATEGIC_MODEL_WORKSPACE_ROOT_REQUIRED');
  const render=tab=>{
    const state=domainState?.get?.()||{};
    const models=buildStrategicModels(state);
    if(models.length!==STRATEGIC_MODEL_IDS.length)throw new Error('STRATEGIC_MODEL_REGISTRY_INCOMPLETE');
    if(tab==='acties'){
      root.innerHTML=`<div class="pvactions strategic-actions">${models.map(model=>{const action=roadmapActionFor(model),exists=(Array.isArray(state.roadmap)?state.roadmap:[]).some(item=>String(item?.id||'')===action.id);return `<button type="button" ${model.id==='bcg'?'data-bcg-roadmap ':''}data-model-roadmap="${esc(model.id)}" ${exists?'disabled':''}><span>${exists?'Actie staat op roadmap':`${esc(model.title)} → roadmap`}</span><i>→</i></button>`}).join('')}<button type="button" data-open-page="canvassen"><span>Open canvassen</span><i>→</i></button><button type="button" data-open-page="strategie-naar-maandagochtend"><span>Vertaal naar uitvoering</span><i>→</i></button></div><p class="sub" data-model-action-status data-bcg-action-status>Acties worden tenant-scoped toegevoegd aan de bestaande Powerhouse-roadmap.</p>`;
      root.querySelectorAll('[data-open-page]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.openPage)));
      root.querySelectorAll('[data-model-roadmap]').forEach(button=>button.addEventListener('click',async()=>{
        const status=root.querySelector('[data-model-action-status]'),id=button.dataset.modelRoadmap;
        try{
          const current=domainState.get(),model=buildStrategicModels(current).find(item=>item.id===id);
          if(!model)throw new Error('STRATEGIC_MODEL_NOT_FOUND');
          const merged=mergeRoadmapFor(current,model);
          domainState.set('roadmap',merged.roadmap);onSaveStatus?.('saving');button.disabled=true;if(status)status.textContent='Roadmap opslaan…';
          await domainState.flush();onSaveStatus?.('saved');button.querySelector('span').textContent='Actie staat op roadmap';if(status)status.textContent='Opgeslagen en server-bevestigd in de canonieke Powerhouse-roadmap.';
        }catch{onSaveStatus?.('error');button.disabled=false;if(status)status.textContent='Opslaan mislukt — geen serverbevestiging; roadmap niet als gewijzigd gemeld.'}
      }));
      return;
    }
    if(tab==='bewijs'){
      root.innerHTML=`<div class="v2reviewlist">${models.map(model=>`<article data-model-id="${esc(model.id)}"><div><small>${esc(model.title)}</small><b>${esc(model.evidence)}</b></div><strong>${esc(model.notePath)}</strong></article>`).join('')}<article><div><small>Registry</small><b>${models.length} van ${STRATEGIC_MODEL_IDS.length} modellen</b></div><strong>legacy-parity</strong></article></div>`;
      return;
    }
    const includeFinance=shell?.dataset.workspace==='modellen';
    root.innerHTML=`${modelCatalog(models,includeFinance)}<div class="strategic-model-grid">${models.map(model=>modelMarkup(model,tab==='invullen')).join('')}${includeFinance?FINANCE_MODEL_CATALOG.map(model=>financeMarkup(model,state)).join(''):''}</div>${tab==='invullen'?'<div class="v2formactions"><button type="button" class="pvprimary" data-strategy-save data-bcg-save>Alle modelnotities opslaan</button><span data-strategy-status data-bcg-status>Tenant-scoped Powerhouse-writeback.</span></div>':''}`;
    bindModelNavigation(root,openPage);
    if(tab!=='invullen'||!domainState)return;
    root.querySelectorAll('[data-model-note]').forEach(node=>node.addEventListener('input',()=>{
      const model=models.find(item=>item.id===node.dataset.modelNote);if(!model)return;
      domainState.set(model.notePath,node.value);onSaveStatus?.('dirty');
    }));
    root.querySelector('[data-strategy-save]')?.addEventListener('click',async()=>{
      const status=root.querySelector('[data-strategy-status]');
      try{onSaveStatus?.('saving');if(status)status.textContent='Opslaan…';await domainState.flush();onSaveStatus?.('saved');if(status)status.textContent='Opgeslagen en server-bevestigd.'}
      catch{onSaveStatus?.('error');if(status)status.textContent='Opslaan mislukt — geen serverbevestiging.'}
    });
  };
  const buttons=[...(shell?.querySelectorAll?.('[data-workspace-tab]')||[])];
  const listeners=buttons.map(button=>{const listener=()=>queueMicrotask(()=>render(button.dataset.workspaceTab));button.addEventListener('click',listener);return[button,listener]});
  render(shell?.dataset.activeTab||'invullen');
  return()=>listeners.forEach(([button,listener])=>button.removeEventListener('click',listener));
}
