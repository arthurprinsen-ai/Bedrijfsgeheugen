import { mountWorkspace } from '../workspace-shell.js';
import { buildBcgModel, buildBcgRoadmapAction, mergeBcgRoadmapAction } from '../strategic-models.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function markup(m,editable=false){
  return `<section class="strategic-model bcg-model" data-model="bcg"><header><small>${esc(m.source)}</small><h3>${esc(m.title)}</h3><p>${esc(m.explanation)}</p></header><div class="bcg-grid">${m.quadrants.map(q=>`<article class="bcg-quadrant${q.current?' current':''}" data-quadrant="${q.id}"><b>${esc(q.label)}</b><p>${esc(q.description)}</p>${q.current?'<strong>Huidige positie</strong>':''}</article>`).join('')}</div><section class="model-conclusion"><b>Conclusie</b><p>${esc(m.conclusion)}</p></section>${editable?`<label><span>${esc(m.prompt)}</span><textarea rows="3" data-bcg-note>${esc(m.note)}</textarea></label><div class="v2formactions"><button type="button" class="pvprimary" data-bcg-save>Opslaan</button><span data-bcg-status>Tenant-scoped Powerhouse-writeback.</span></div>`:''}</section>`;
}

export function mountStrategicModelWorkspace(root,{contract,view,domainState,openPage}={}){
  let workspace;

  const render=(tab,content)=>{
    const state=domainState?.get?.()||{};
    const model=buildBcgModel(state);

    if(tab==='acties'){
      const action=buildBcgRoadmapAction(model);
      const alreadyOnRoadmap=(Array.isArray(state.roadmap)?state.roadmap:[]).some(item=>String(item?.id||'')===action.id);
      content.innerHTML=`<div class="pvactions"><button type="button" class="primary" data-bcg-roadmap ${alreadyOnRoadmap?'disabled':''}><span>${alreadyOnRoadmap?'BCG-actie staat op roadmap':'Zet BCG-actie op roadmap'}</span><i>→</i></button><button type="button" data-open-page="canvassen"><span>Open canvassen</span><i>→</i></button><button type="button" data-open-page="strategie-naar-maandagochtend"><span>Vertaal naar uitvoering</span><i>→</i></button></div><p class="sub" data-bcg-action-status>${alreadyOnRoadmap?'Canonieke roadmap bevat deze BCG-actie al.':'De actie wordt tenant-scoped toegevoegd aan de bestaande Powerhouse-roadmap.'}</p>`;
      content.querySelectorAll('[data-open-page]').forEach(b=>b.addEventListener('click',()=>openPage?.(b.dataset.openPage)));
      content.querySelector('[data-bcg-roadmap]')?.addEventListener('click',async e=>{
        const button=e.currentTarget;
        const status=content.querySelector('[data-bcg-action-status]');
        try{
          const current=domainState.get();
          const merged=mergeBcgRoadmapAction(current,buildBcgRoadmapAction(buildBcgModel(current)));
          domainState.set('roadmap',merged.roadmap);
          workspace?.setSaveStatus('saving');
          button.disabled=true;
          if(status)status.textContent='Roadmap opslaan…';
          await domainState.flush();
          workspace?.setSaveStatus('saved');
          button.querySelector('span').textContent='BCG-actie staat op roadmap';
          if(status)status.textContent='Opgeslagen en server-bevestigd in de canonieke Powerhouse-roadmap.';
        }catch{
          workspace?.setSaveStatus('error');
          button.disabled=false;
          if(status)status.textContent='Opslaan mislukt — geen serverbevestiging; roadmap niet als bewezen gewijzigd gemeld.';
        }
      });
      return;
    }

    if(tab==='bewijs'){
      content.innerHTML='<div class="v2reviewlist"><article><div><small>Modelauthority</small><b>Canonieke klant- en marktstate</b></div><strong>Powerhouse</strong></article><article><div><small>BCG-assen</small><b>Marktgroei × positie t.o.v. branche</b></div><strong>legacy-parity</strong></article><article><div><small>Notitie-writeback</small><b>portal.strategicModels.bcg.note</b></div><strong>tenant-scoped</strong></article><article><div><small>Actie-writeback</small><b>roadmap[]</b></div><strong>canonical + dedupe</strong></article></div>';
      return;
    }

    content.innerHTML=markup(model,tab==='invullen');
    if(tab!=='invullen'||!domainState)return;
    content.querySelector('[data-bcg-note]')?.addEventListener('input',e=>{
      domainState.set(model.notePath,e.currentTarget.value);
      workspace?.setSaveStatus('dirty');
    });
    content.querySelector('[data-bcg-save]')?.addEventListener('click',async()=>{
      const status=content.querySelector('[data-bcg-status]');
      try{
        workspace?.setSaveStatus('saving');
        if(status)status.textContent='Opslaan…';
        await domainState.flush();
        workspace?.setSaveStatus('saved');
        if(status)status.textContent='Opgeslagen en server-bevestigd.';
      }catch{
        workspace?.setSaveStatus('error');
        if(status)status.textContent='Opslaan mislukt — geen serverbevestiging.';
      }
    });
  };

  workspace=mountWorkspace(root,contract,{title:view?.title||'Strategiemodellen',description:view?.description||'Strategiemodellen op actuele Powerhouse-data.',saveStatus:domainState?.status?.()||'idle',render:c=>render('invullen',c),onTabChange:(tab,c)=>render(tab,c)});
  workspace.shell.dataset.strategicModelWorkspace='semantic';
  return workspace;
}
