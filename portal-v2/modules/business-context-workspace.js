import {buildBusinessContext,BUSINESS_STAGES,STRATEGIC_EVENTS,USER_GOALS} from '../../brain/context/business-context-engine.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const selected=(value,current)=>String(value)===String(current)?' selected':'';

function stageOptions(current){
  return Object.values(BUSINESS_STAGES).map(item=>'<option value="'+esc(item.id)+'"'+selected(item.id,current)+'>'+esc(item.label)+'</option>').join('');
}
function checkboxGrid(items,current,name){
  const active=new Set(current||[]);
  return '<div class="v2contextchecks">'+Object.values(items).map(item=>'<label><input type="checkbox" name="'+esc(name)+'" value="'+esc(item.id)+'"'+(active.has(item.id)?' checked':'')+'><span>'+esc(item.label)+'</span></label>').join('')+'</div>';
}
function statusLabel(context){
  if(context.evidenceMode==='unproven-default')return 'Nog niet bevestigd';
  if(context.primary.source==='explicit')return 'Door ondernemer bevestigd';
  return 'Afgeleid uit bedrijfsdata';
}
function renderSummary(context){
  const overlays=[...context.eventLabels,...context.goalLabels];
  const health=Object.entries(context.health).map(([key,value])=>'<span><b>'+esc(key)+'</b> '+esc(value)+'</span>').join('');
  return '<section class="v2contextsummary"><div><span class="v2workspaceeyebrow">Powerhouse-context</span><h3>'+esc(context.primary.label)+'</h3><p>'+esc(statusLabel(context))+(overlays.length?' · '+esc(overlays.join(' · ')):'')+'</p></div><div class="v2contexthealth">'+health+'</div></section>';
}
function renderForm(root,state,message){
  const context=buildBusinessContext(state);
  const stored=state?.portal?.business_context||{};
  const stage=stored.stage||context.primary.stage;
  const events=Array.isArray(stored.events)?stored.events:context.events;
  const goals=Array.isArray(stored.goals)?stored.goals:context.goals;
  root.innerHTML=renderSummary(context)
    +'<section class="v2legacyprofilecard"><h3>Klopt deze bedrijfssituatie?</h3><p>Powerhouse gebruikt deze context om analyses, modellen, scenario’s, prioriteiten en portaalonderdelen te ordenen. Je kunt meerdere gebeurtenissen en doelen tegelijk kiezen.</p><div class="v2contextconfirm"><button type="button" class="pvprimary" data-context-confirm>Dit klopt</button><button type="button" data-context-edit>Pas situatie aan</button><span data-context-message>'+esc(message||'')+'</span></div></section>'
    +'<section class="v2legacyprofilecard" data-context-editor hidden><label class="v2contextfield"><span>Primaire bedrijfsfase</span><select data-context-stage>'+stageOptions(stage)+'</select></label><div class="v2contextgroup"><h4>Wat speelt er tegelijk?</h4>'+checkboxGrid(STRATEGIC_EVENTS,events,'events')+'</div><div class="v2contextgroup"><h4>Wat wil je bereiken?</h4>'+checkboxGrid(USER_GOALS,goals,'goals')+'</div><div class="v2formactions"><button type="button" class="pvprimary" data-context-save>Opslaan & Powerhouse bijwerken</button><span data-context-save-message>De context wordt tenant-scoped opgeslagen en gebruikt door het brein.</span></div></section>';
  return context;
}
function checkedValues(root,name){
  return Array.from(root.querySelectorAll('input[name="'+name+'"]:checked')).map(input=>input.value);
}
async function persistContext(domainState,{stage,events,goals}){
  domainState?.set?.('portal.business_context.stage',stage);
  domainState?.set?.('portal.business_context.events',events);
  domainState?.set?.('portal.business_context.goals',goals);
  domainState?.patch?.('portal.business_context',{confirmed:true,confirmed_at:new Date().toISOString(),confirmation_source:'entrepreneur'});
  return domainState?.flush?.();
}

export function mountBusinessContextWorkspace(root,{domainState,onSaveStatus,onUpdated}={}){
  if(!root?.querySelectorAll)throw new TypeError('BUSINESS_CONTEXT_ROOT_REQUIRED');
  let destroyed=false;
  const draw=(message='')=>{
    if(destroyed)return;
    const state=domainState?.get?.()||{};
    renderForm(root,state,message);
    const editor=root.querySelector('[data-context-editor]');
    root.querySelector('[data-context-edit]')?.addEventListener('click',()=>{if(editor)editor.hidden=false;});
    root.querySelector('[data-context-confirm]')?.addEventListener('click',async()=>{
      try{
        onSaveStatus?.('saving');
        const current=buildBusinessContext(domainState?.get?.()||{});
        await persistContext(domainState,{stage:current.primary.stage,events:[...current.events],goals:[...current.goals]});
        onSaveStatus?.('saved');
        draw('Bevestigd en teruggeschreven naar Powerhouse.');
        onUpdated?.();
      }catch(error){
        onSaveStatus?.('error');
        draw('Opslaan mislukt. De context is niet als bevestigd gemarkeerd.');
      }
    });
    root.querySelector('[data-context-save]')?.addEventListener('click',async()=>{
      const stage=root.querySelector('[data-context-stage]')?.value;
      const events=checkedValues(root,'events');
      const goals=checkedValues(root,'goals');
      const message=root.querySelector('[data-context-save-message]');
      try{
        onSaveStatus?.('saving');
        if(message)message.textContent='Opslaan…';
        await persistContext(domainState,{stage,events,goals});
        onSaveStatus?.('saved');
        draw('Situatie aangepast en Powerhouse opnieuw gevoed.');
        onUpdated?.();
      }catch(error){
        onSaveStatus?.('error');
        if(message)message.textContent='Opslaan mislukt — de oude bevestigde context blijft leidend.';
      }
    });
  };
  draw();
  return Object.freeze({refresh:()=>draw(),destroy(){destroyed=true;root.replaceChildren();}});
}
