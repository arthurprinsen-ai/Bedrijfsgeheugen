import { mountWorkspace } from '../workspace-shell.js';
import { buildBcgModel, upsertBcgRoadmapAction } from '../strategic-models.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function markup(m,editable=false){
 return `<section class="strategic-model bcg-model" data-model="bcg">
  <header><small>${esc(m.source)}</small><h3>${esc(m.title)}</h3><p>${esc(m.explanation)}</p></header>
  <div class="bcg-grid">${m.quadrants.map(q=>`<article class="bcg-quadrant${q.current?' current':''}" data-quadrant="${q.id}"><b>${esc(q.label)}</b><p>${esc(q.description)}</p>${q.current?'<strong>Huidige positie</strong>':''}</article>`).join('')}</div>
  <p class="sub" data-bcg-legacy-guidance>${esc(m.legacyGuidance)}</p>
  <section class="model-conclusion"><b>Conclusie</b><p>${esc(m.conclusion)}</p></section>
  ${editable?`<label><span>${esc(m.prompt)}</span><textarea rows="3" data-bcg-note>${esc(m.note)}</textarea></label><div class="v2formactions"><button type="button" class="pvprimary" data-bcg-save>Opslaan</button><span data-bcg-status>Tenant-scoped Powerhouse-writeback.</span></div>`:''}
 </section>`;
}

function actionMarkup(model){
 const bcgAction=model.roadmapAction?`<button type="button" class="primary" data-bcg-roadmap><span>${esc(model.roadmapAction.title)}</span><i>→</i></button><span data-bcg-roadmap-status>Schrijft naar bestaande Powerhouse-roadmap.</span>`:'';
 return `<div class="pvactions">${bcgAction}<button type="button" data-open-page="canvassen"><span>Open canvassen</span><i>→</i></button><button type="button" data-open-page="strategie-naar-maandagochtend"><span>Vertaal naar uitvoering</span><i>→</i></button></div>`;
}

export function mountStrategicModelWorkspace(root,{contract,view,domainState,openPage}={}){
 let workspace;
 const render=(tab,content)=>{
  const model=buildBcgModel(domainState?.get?.()||{});
  if(tab==='acties'){
   content.innerHTML=actionMarkup(model);
   content.querySelectorAll('[data-open-page]').forEach(b=>b.addEventListener('click',()=>openPage?.(b.dataset.openPage)));
   content.querySelector('[data-bcg-roadmap]')?.addEventListener('click',async()=>{
    const status=content.querySelector('[data-bcg-roadmap-status]');
    if(!domainState?.get||!domainState?.set||!domainState?.flush){if(status)status.textContent='Geblokkeerd — geen canonieke Powerhouse-context.';return;}
    try{
     workspace?.setSaveStatus('saving');
     if(status)status.textContent='Roadmapactie opslaan…';
     const current=domainState.get('portal.roadmap.items')||[];
     const next=upsertBcgRoadmapAction(current,model);
     domainState.set('portal.roadmap.items',next);
     await domainState.flush();
     workspace?.setSaveStatus('saved');
     if(status)status.textContent='Roadmapactie opgeslagen en server-bevestigd.';
    }catch{
     workspace?.setSaveStatus('error');
     if(status)status.textContent='Opslaan mislukt — geen serverbevestiging.';
    }
   });
   return;
  }
  if(tab==='bewijs'){
   content.innerHTML='<div class="v2reviewlist"><article><div><small>Modelauthority</small><b>Canonieke klant- en marktstate</b></div><strong>Powerhouse</strong></article><article><div><small>BCG-assen</small><b>Marktgroei × positie t.o.v. branche</b></div><strong>legacy-parity</strong></article><article><div><small>Writeback</small><b>portal.strategicModels.bcg.note + portal.roadmap.items</b></div><strong>tenant-scoped</strong></article></div>';
   return;
  }
  content.innerHTML=markup(model,tab==='invullen');
  if(tab!=='invullen'||!domainState)return;
  content.querySelector('[data-bcg-note]')?.addEventListener('input',e=>{domainState.set(model.notePath,e.currentTarget.value);workspace?.setSaveStatus('dirty')});
  content.querySelector('[data-bcg-save]')?.addEventListener('click',async()=>{
   const s=content.querySelector('[data-bcg-status]');
   try{
    workspace?.setSaveStatus('saving');
    if(s)s.textContent='Opslaan…';
    await domainState.flush();
    workspace?.setSaveStatus('saved');
    if(s)s.textContent='Opgeslagen en server-bevestigd.';
   }catch{
    workspace?.setSaveStatus('error');
    if(s)s.textContent='Opslaan mislukt — geen serverbevestiging.';
   }
  });
 };
 workspace=mountWorkspace(root,contract,{title:view?.title||'Strategiemodellen',description:view?.description||'Strategiemodellen op actuele Powerhouse-data.',saveStatus:domainState?.status?.()||'idle',render:c=>render('invullen',c),onTabChange:(tab,c)=>render(tab,c)});
 workspace.shell.dataset.strategicModelWorkspace='semantic';
 return workspace;
}
