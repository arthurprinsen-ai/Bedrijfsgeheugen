import { buildCanvasPresentation } from '../canvas-presentation.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TABS=[['invullen','Invullen'],['analyse','Analyse'],['acties','Acties'],['bewijs','Bewijs']];

function canvasFields(model){return `<div class="canvas-grid">${model.canvases.map(canvas=>`<details class="canvas-card" open data-canvas-id="${esc(canvas.id)}"><summary><span><b>${esc(canvas.title)}</b><small>${canvas.sections.length} inhoudsblokken · ${canvas.answer?'eigen antwoord aanwezig':'eigen antwoord ontbreekt'}</small></span><span>⌄</span></summary><label class="canvas-own"><span>${esc(canvas.prompt)}</span><textarea rows="3" data-canvas-answer="${esc(canvas.id)}" placeholder="Jouw antwoord — dit kan het model niet voor je bedenken.">${esc(canvas.answer)}</textarea></label><label class="canvas-owner"><span>Eigenaar</span><input data-canvas-owner="${esc(canvas.id)}" value="${esc(canvas.owner)}" placeholder="Naam of rol"></label></details>`).join('')}</div><output class="canvas-save" aria-live="polite"></output>`;}
function canvasAnalysis(model){return `<article class="canvas-conclusion"><strong>Conclusie</strong><p>${esc(model.conclusion.text)}</p><small>Bron: ${esc(model.conclusion.source)} · confidence ${Math.round(model.conclusion.confidence*100)}%</small></article><div class="canvas-grid">${model.canvases.map(canvas=>`<article class="canvas-card" data-canvas-analysis="${esc(canvas.id)}"><h4>${esc(canvas.title)}</h4><div class="canvas-sections">${canvas.sections.map(section=>`<div class="canvas-section"><span>${esc(section.label)}</span><strong>${esc(section.value||'—')}</strong></div>`).join('')}</div></article>`).join('')}</div>`;}
function canvasActions(){return `<div class="pvactions"><button type="button" data-canvas-action="strategy" class="primary"><span>Strategie aanscherpen</span><i>→</i></button><button type="button" data-canvas-action="conclusion"><span>Eindconclusie bijwerken</span><i>→</i></button></div>`;}
function canvasEvidence(model){return `<div class="v2reviewlist"><article><div><small>State</small><b>portal.canvases</b></div><strong>canonieke Powerhouse-state</strong></article><article><div><small>Canvassen</small><b>${model.canvases.map(c=>esc(c.title)).join(' · ')}</b></div><strong>${model.completion.answered}/6 klantantwoorden</strong></article><article><div><small>Writeback</small><b>domainState.flush()</b></div><strong>server-confirmed</strong></article></div>`;}

export function mountCanvasWorkspace(root,{domainState}={}){
 if(!root||!domainState?.get)return ()=>{};
 root.dataset.functionalWorkspace='canvassen';
 let active='invullen';
 const render=()=>{
  const model=buildCanvasPresentation(domainState.get()||{});
  root.innerHTML=`<div class="v2workspace v2workspace-canvas" data-active-tab="${active}"><div class="v2workspacebar"><div><span class="v2workspaceeyebrow">Werkruimte</span><strong>Zes canvassen · dezelfde bedrijfswaarheid</strong></div><span class="v2savestatus" data-save-status="${domainState.status?.()||'idle'}">${model.completion.answered}/${model.completion.total} eigen antwoorden</span></div><div class="v2workspacetabs" role="tablist">${TABS.map(([id,label])=>`<button type="button" role="tab" data-workspace-tab="${id}" aria-selected="${id===active}">${label}</button>`).join('')}</div><div class="v2workspacecontent" data-workspace-content>${active==='invullen'?canvasFields(model):active==='analyse'?canvasAnalysis(model):active==='acties'?canvasActions():canvasEvidence(model)}</div></div>`;
  root.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{active=button.dataset.workspaceTab;render();}));
  root.querySelectorAll('[data-canvas-answer],[data-canvas-owner]').forEach(field=>field.addEventListener('change',async()=>{
   const id=field.dataset.canvasAnswer||field.dataset.canvasOwner;const current=domainState.get()||{};const canvases=current.portal?.canvases||{};const previous=canvases[id]||{};
   const next={...previous,...(field.dataset.canvasAnswer?{answer:field.value}:{owner:field.value})};
   domainState.set({...current,portal:{...(current.portal||{}),canvases:{...canvases,[id]:next}}});
   try{await domainState.flush?.();}catch(error){console.error('CANVAS_WRITEBACK_FAILED',error);}
   render();
  }));
 };
 render();const unsub=domainState.subscribe?.(()=>render());return ()=>unsub?.();
}
