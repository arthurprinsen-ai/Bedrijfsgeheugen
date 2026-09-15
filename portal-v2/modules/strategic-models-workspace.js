import { buildStrategicModels } from '../strategic-models.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderRows(rows=[]){return rows.map(([label,value])=>`<div class="model-row"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}
function renderModel(model){
 const metrics=model.metrics?`<div class="model-metrics">${Object.entries(model.metrics).map(([k,v])=>`<span><small>${esc(k)}</small><b>${typeof v==='number'?esc(v.toFixed(1)):esc(v)}</b></span>`).join('')}</div>`:'';
 const sections=model.sections?`<div class="model-rows">${renderRows(model.sections)}</div>`:'';
 const quadrants=model.quadrants?`<div class="bcg-grid">${model.quadrants.map(q=>`<article class="${q.active?'active':''}" data-bcg="${esc(q.id)}"><b>${esc(q.title)}</b><p>${esc(q.explanation)}</p></article>`).join('')}</div>`:'';
 return `<details class="strategic-model" open data-model-id="${esc(model.id)}"><summary><span><b>${esc(model.title)}</b><small>${esc(model.framework)}</small></span><span>⌄</span></summary>${model.explanation?`<p class="model-explanation">${esc(model.explanation)}</p>`:''}${metrics}${quadrants}${sections}<footer>Bron: ${esc(model.source)}${model.freshness?` · freshness ${esc(model.freshness)}`:''}${model.confidence!=null?` · confidence ${esc(model.confidence)}`:''}</footer></details>`;
}
export function mountStrategicModelsWorkspace(root,{domainState,pageId='strategiemodellen'}={}){
 if(!root||!domainState?.get)return ()=>{};
 root.dataset.functionalWorkspace=pageId;
 const draw=()=>{const models=buildStrategicModels(domainState.get()||{});root.innerHTML=`<section class="pvmodule strategic-models-parity" data-strategic-models="legacy-parity"><header class="pvmodulehead"><div><span>${models.length} modellen uit dezelfde klantstate</span><h3>Strategiemodellen</h3></div></header><div class="v2workspacetabs" role="tablist"><button type="button" role="tab" data-workspace-tab="analyse" aria-selected="true">Analyse</button></div><p class="wzsub">Geen lege sjablonen: waarden, positie en uitleg worden afgeleid uit dezelfde canonieke Powerhouse-state als de rest van het portaal.</p><div class="strategic-model-list">${models.map(renderModel).join('')}</div></section>`;};
 draw();const unsub=domainState.subscribe?.(()=>draw());return ()=>unsub?.();
}
