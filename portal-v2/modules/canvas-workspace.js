import { buildCanvasPresentation } from '../canvas-presentation.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function mountCanvasWorkspace(root,{domainState}={}){
 if(!root||!domainState?.get)return ()=>{};
 const draw=()=>{
  const state=domainState.get()||{};const model=buildCanvasPresentation(state);
  root.innerHTML=`<section class="pvmodule canvas-parity" data-canvas-parity="full">
   <header class="pvmodulehead"><div><span>${model.completion.answered}/${model.completion.total} eigen antwoorden</span><h3>Zes canvassen · dezelfde bedrijfswaarheid</h3></div></header>
   <article class="canvas-conclusion"><strong>Conclusie</strong><p>${esc(model.conclusion.text)}</p><small>Bron: ${esc(model.conclusion.source)} · confidence ${Math.round(model.conclusion.confidence*100)}%</small></article>
   <div class="canvas-grid">${model.canvases.map(canvas=>`<details class="canvas-card" open data-canvas-id="${esc(canvas.id)}"><summary><span><b>${esc(canvas.title)}</b><small>${canvas.sections.length} inhoudsblokken · ${canvas.answer?'eigen antwoord aanwezig':'eigen antwoord ontbreekt'}</small></span><span>⌄</span></summary><div class="canvas-sections">${canvas.sections.map(section=>`<div class="canvas-section"><span>${esc(section.label)}</span><strong>${esc(section.value||'—')}</strong></div>`).join('')}</div><label class="canvas-own"><span>${esc(canvas.prompt)}</span><textarea style="min-height:88px" rows="3" data-canvas-answer="${esc(canvas.id)}" placeholder="Jouw antwoord — dit kan het model niet voor je bedenken.">${esc(canvas.answer)}</textarea></label><label class="canvas-owner"><span>Eigenaar</span><input style="min-height:44px" data-canvas-owner="${esc(canvas.id)}" value="${esc(canvas.owner)}" placeholder="Naam of rol"></label></details>`).join('')}</div>
   <output class="canvas-save" aria-live="polite"></output>
  </section>`;
  root.querySelectorAll('[data-canvas-answer],[data-canvas-owner]').forEach(field=>field.addEventListener('change',async()=>{
   const id=field.dataset.canvasAnswer||field.dataset.canvasOwner;const current=domainState.get()||{};const canvases=current.portal?.canvases||{};const previous=canvases[id]||{};
   const next={...previous,...(field.dataset.canvasAnswer?{answer:field.value}:{owner:field.value})};
   domainState.set({...current,portal:{...(current.portal||{}),canvases:{...canvases,[id]:next}}});
   const out=root.querySelector('.canvas-save');if(out)out.textContent='Opslaan…';
   try{await domainState.flush?.();if(out)out.textContent='Opgeslagen in de canonieke Powerhouse-klantstate.';}catch(error){if(out)out.textContent='Opslaan mislukt — wijziging blijft lokaal zichtbaar maar is niet als serverbevestigd gemarkeerd.';console.error('CANVAS_WRITEBACK_FAILED',error);}
  }));
 };
 draw();const unsub=domainState.subscribe?.(()=>draw());return ()=>unsub?.();
}
