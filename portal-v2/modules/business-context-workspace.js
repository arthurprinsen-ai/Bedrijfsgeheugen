import {buildBusinessContext,BUSINESS_STAGES,STRATEGIC_EVENTS,USER_GOALS} from '../../brain/context/business-context-engine.mjs';
import {buildGoalForecasts,buildJourneyProgress,GOAL_METRICS} from '../../brain/context/goal-forecast-engine.mjs';
import {buildGoalScenarios,GOAL_LEVERS} from '../../brain/context/goal-scenario-engine.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const selected=(value,current)=>String(value)===String(current)?' selected':'';

const fmt=(value,unit='')=>{
  if(value==null||!Number.isFinite(Number(value)))return '—';
  const n=Number(value);
  if(unit==='€')return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
  return new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(n)+(unit?' '+unit:'');
};
const dateLabel=value=>{if(!value)return '—';const d=new Date(value);return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('nl-NL',{day:'2-digit',month:'short',year:'numeric'}).format(d):'—';};
const trackLabel=status=>({ 'on-track':'Op koers','at-risk':'Risico op missen','off-track':'Niet op koers'})[status]||'Nog niet voorspelbaar';

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

function renderJourney(state,context){
  const journey=buildJourneyProgress(state,context);
  const target=state?.portal?.business_context?.target_stage||'';
  const nodes=journey.stages.length?journey.stages:[context.primary.stage];
  return '<section class="v2journey"><div class="v2journeyhead"><div><span class="v2workspaceeyebrow">Bedrijfsreis</span><h3>Waar sta je en waar wil je heen?</h3></div><label>Gewenste fase<select data-context-target-stage><option value="">Nog niet gekozen</option>'+stageOptions(target)+'</select></label></div><div class="v2journeytrack">'+nodes.map((id,index)=>'<div class="v2journeynode '+(id===context.primary.stage?'current':'')+' '+(id===target?'target':'')+'"><i>'+String(index+1)+'</i><span>'+esc(BUSINESS_STAGES[id]?.label||id)+'</span></div>').join('<b>→</b>')+'</div><p>'+esc(journey.note)+'</p></section>';
}
function renderGoalTargets(state,goals){
  if(!goals.length)return '<section class="v2goalempty"><h3>Doelen & voorspellingen</h3><p>Kies eerst één of meer doelen. Daarna kun je per doel een meetbare huidige stand, doelwaarde en doeldatum vastleggen.</p></section>';
  const targets=state?.portal?.business_context?.goal_targets||{};
  return '<section class="v2goaltargets"><div class="v2goalhead"><div><span class="v2workspaceeyebrow">Doelen</span><h3>Maak doelen meetbaar</h3></div><p>Powerhouse voorspelt alleen met minimaal 3 historische meetpunten. Zonder bewijs toont het benodigde tempo, maar geen schijnforecast.</p></div><div class="v2goaleditgrid">'+goals.map(id=>{const metric=GOAL_METRICS[id];const target=targets[id]||{};if(!metric)return '';return '<article data-goal-editor="'+esc(id)+'"><h4>'+esc(USER_GOALS[id]?.label||id)+'</h4><small>'+esc(metric.label)+' · '+esc(metric.unit)+'</small><label>Huidige stand<input type="number" step="any" data-goal-current="'+esc(id)+'" value="'+esc(target.current_value??'')+'"></label><label>Doelwaarde<input type="number" step="any" data-goal-target="'+esc(id)+'" value="'+esc(target.target_value??'')+'"></label><label>Doeldatum<input type="date" data-goal-date="'+esc(id)+'" value="'+esc(String(target.target_date||'').slice(0,10))+'"></label></article>';}).join('')+'</div></section>';
}
function renderForecasts(state,goals){
  const forecasts=buildGoalForecasts(state,goals);
  if(!forecasts.length)return '';
  return '<section class="v2forecastsection"><div class="v2goalhead"><div><span class="v2workspaceeyebrow">Forecast</span><h3>Liggen je doelen op koers?</h3></div><p>Verwachting en bandbreedte worden alleen getoond als de tijdreeks voldoende bewijs bevat.</p></div><div class="v2forecastgrid">'+forecasts.map(item=>{
    const pct=item.progress==null?null:Math.round(item.progress);
    const forecast=item.forecast?'<div class="v2forecastband"><b>Verwachting '+fmt(item.forecast.expected,item.unit)+'</b><span>band '+fmt(item.forecast.lower,item.unit)+' – '+fmt(item.forecast.upper,item.unit)+'</span><small>'+item.forecast.points+' meetpunten · '+esc(item.forecast.method)+'</small></div>':'<div class="v2forecastband unavailable"><b>Nog geen betrouwbare forecast</b><span>'+item.historyPoints+'/3 historische meetpunten beschikbaar</span><small>Powerhouse verzint geen waarschijnlijkheid zonder trendbewijs.</small></div>';
    const pace=item.requiredPace?fmt(item.requiredPace.perMonth,item.unit)+' per maand':'—';
    return '<article class="v2forecastcard" data-track="'+esc(item.trackStatus||'unknown')+'"><div class="v2forecasttitle"><div><h4>'+esc(USER_GOALS[item.goalId]?.label||item.goalId)+'</h4><small>'+esc(item.label)+'</small></div><span>'+esc(trackLabel(item.trackStatus))+'</span></div><div class="v2goalnumbers"><div><small>Nu</small><b>'+fmt(item.current,item.unit)+'</b></div><div><small>Doel</small><b>'+fmt(item.target,item.unit)+'</b></div><div><small>Datum</small><b>'+dateLabel(item.targetDate)+'</b></div></div><div class="v2progress"><i style="width:'+(pct==null?0:pct)+'%"></i></div><small class="v2progresslabel">'+(pct==null?'Voortgang nog niet berekenbaar':pct+'% van doel')+' · benodigd tempo '+pace+'</small>'+forecast+'<div class="v2milestones">'+item.milestones.map(m=>'<span><i></i><b>'+esc(m.label)+'</b><small>'+dateLabel(m.date)+'</small></span>').join('')+'</div></article>';
  }).join('')+'</div></section>';
}

function renderGoalScenarios(state,goals){
  const scenarios=buildGoalScenarios(state,goals);
  if(!scenarios.length)return '';
  return '<section class="v2scenariosection"><div class="v2goalhead"><div><span class="v2workspaceeyebrow">Wat-als</span><h3>Welke hefbomen brengen je dichter bij je doel?</h3></div><p>Effecten hieronder zijn scenario-aannames, geen voorspellingen. Koppel bewijs aan een aanname voordat Powerhouse haar als onderbouwd behandelt.</p></div><div class="v2scenariogrid">'+scenarios.map(item=>{
    const levers=(GOAL_LEVERS[item.goalId]||[]);
    const actionRows=(item.nextBestActions||[]).map(action=>'<div class="v2nextbestrow"><button type="button" data-scenario-open="'+esc(action.page)+'"><span><b>'+esc(action.label)+'</b><small>'+esc(action.action)+'</small></span><i>→</i></button><button type="button" class="v2roadmapadd" data-scenario-roadmap="'+esc(item.goalId)+'" data-lever-id="'+esc(action.leverId)+'">+ Roadmap</button></div>').join('');
    const leverInputs=levers.map(lever=>{
      const active=item.levers.find(x=>x.id===lever.id);
      const refs=(active?.sourceRefs||[]).join(', ');
      const directionHint=item.direction==='down'?'negatief effect = verbetering':'positief effect = verbetering';
      return '<div class="v2lever" data-alignment="'+esc(active?.alignment||'neutral')+'"><span><b>'+esc(lever.label)+'</b><small>Verwacht effect op '+esc(item.label)+' ('+esc(item.unit)+') · '+directionHint+'</small></span><input type="number" step="any" data-scenario-effect="'+esc(item.goalId)+'" data-lever-id="'+esc(lever.id)+'" value="'+esc(active?.effect??'')+'" placeholder="bijv. 2"><input type="text" data-scenario-evidence="'+esc(item.goalId)+'" data-lever-id="'+esc(lever.id)+'" value="'+esc(refs)+'" placeholder="bewijs-IDs, komma-gescheiden"></div>';
    }).join('');
    const before=fmt(item.baselineExpected,item.unit), after=fmt(item.scenarioExpected,item.unit), target=fmt(item.target,item.unit);
    const improvement=item.gapImprovement==null?'—':fmt(item.gapImprovement,item.unit);
    return '<article class="v2scenariocard"><div class="v2forecasttitle"><div><h4>'+esc(USER_GOALS[item.goalId]?.label||item.goalId)+'</h4><small>'+esc(item.label)+'</small></div><span>'+esc(item.scenarioStatus==='target-reached'?'Doel in scenario bereikt':'Scenario')+'</span></div><div class="v2scenarioflow"><div><small>Baseline</small><b>'+before+'</b></div><i>→</i><div><small>Met aannames</small><b>'+after+'</b></div><i>→</i><div><small>Doel</small><b>'+target+'</b></div></div><div class="v2scenarioimprovement"><span>Verkleining doelgat</span><b>'+improvement+'</b></div><div class="v2levergrid">'+leverInputs+'</div><div class="v2nextbest"><h5>Volgende beste acties</h5>'+actionRows+'</div><small class="v2truthline">Forecast: '+esc(item.truth.forecast)+' · scenario: wat-als-aannames · '+item.truth.evidenceLinkedEffects+' effecten met bewijs gekoppeld</small></article>';
  }).join('')+'</div></section>';
}

function renderOutcomeLearning(context){
  const learning=context?.goalOutcomeLearning;
  if(!learning||(!learning.records.length&&!learning.calibrations.length))return '<section class="v2learningempty"><div><span class="v2workspaceeyebrow">Leren van resultaat</span><h3>Wat werkte echt?</h3><p>Nog geen gemeten goal-scenario outcomes beschikbaar. Voeg na uitvoering bewijs toe in Outcomes & evidence; daarna vergelijkt Powerhouse verwacht en werkelijk effect.</p></div><button type="button" data-outcome-open="outcomes-evidence">Meet resultaat →</button></section>';
  const calibrationRows=learning.calibrations.map(item=>{
    const factor=item.calibrationFactor==null?'—':new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(item.calibrationFactor)+'×';
    const status=item.calibrationStatus==='available'?'Gekalibreerd':'Nog leren';
    return '<article class="v2calibrationcard" data-calibration-status="'+esc(item.calibrationStatus)+'"><div><h4>'+esc(item.goalId)+' · '+esc(item.leverId)+'</h4><small>'+item.verifiedObservations+' geverifieerde metingen</small></div><strong>'+esc(factor)+'</strong><span>'+esc(status)+'</span></article>';
  }).join('');
  const recent=learning.records.slice().sort((a,b)=>String(b.observedAt||'').localeCompare(String(a.observedAt||''))).slice(0,6).map(item=>{
    const expected=fmt(item.expectedEffect,'');
    const realized=fmt(item.realizedEffect,'');
    const label=({'overperformed':'Beter dan verwacht','within-range':'Zoals verwacht','underperformed':'Minder dan verwacht','opposite-direction':'Tegengesteld effect','unquantified':'Niet kwantificeerbaar'})[item.classification]||item.classification;
    return '<article class="v2outcomerow"><div><b>'+esc(item.goalId)+' · '+esc(item.leverId)+'</b><small>'+esc(label)+(item.verified?' · geverifieerd':' · nog niet geverifieerd')+'</small></div><span>verwacht '+expected+' → werkelijk '+realized+'</span></article>';
  }).join('');
  return '<section class="v2learningsection"><div class="v2goalhead"><div><span class="v2workspaceeyebrow">Learning loop</span><h3>Wat werkte echt?</h3></div><button type="button" data-outcome-open="outcomes-evidence">Open Outcomes & evidence</button></div><p>Pas vanaf 3 geverifieerde uitkomsten per hefboom gebruikt Powerhouse een historische correctiefactor. Tot die tijd blijft het scenario een aanname.</p><div class="v2calibrationgrid">'+calibrationRows+'</div><div class="v2outcomelist">'+recent+'</div></section>';
}

function collectGoalScenarios(root,goals,previous={}){
  const next={...previous};
  for(const goalId of goals){
    const levers={...(previous?.[goalId]?.levers||{})};
    root.querySelectorAll('[data-scenario-effect="'+goalId+'"]').forEach(input=>{
      const id=input.dataset.leverId;
      const raw=input.value;
      const evidenceInput=root.querySelector('[data-scenario-evidence="'+goalId+'"][data-lever-id="'+id+'"]');
      const source_refs=String(evidenceInput?.value||'').split(',').map(x=>x.trim()).filter(Boolean);
      levers[id]={...(levers[id]||{}),effect:raw===''?null:Number(raw),source_refs};
    });
    next[goalId]={...(previous?.[goalId]||{}),levers};
  }
  return next;
}
function collectGoalTargets(root,goals,previous={}){
  const next={...previous};
  for(const id of goals){
    const current=root.querySelector('[data-goal-current="'+id+'"]')?.value;
    const target=root.querySelector('[data-goal-target="'+id+'"]')?.value;
    const date=root.querySelector('[data-goal-date="'+id+'"]')?.value;
    next[id]={...(previous[id]||{}),current_value:current===''?null:Number(current),target_value:target===''?null:Number(target),target_date:date||null};
  }
  return next;
}

function renderForm(root,state,message){
  const context=buildBusinessContext(state);
  const stored=state?.portal?.business_context||{};
  const stage=stored.stage||context.primary.stage;
  const events=Array.isArray(stored.events)?stored.events:context.events;
  const goals=Array.isArray(stored.goals)?stored.goals:context.goals;
  root.innerHTML=renderSummary(context)+renderJourney(state,context)+renderForecasts(state,goals)+renderGoalScenarios(state,goals)+renderOutcomeLearning(context)
    +'<section class="v2legacyprofilecard"><h3>Klopt deze bedrijfssituatie?</h3><p>Powerhouse gebruikt deze context om analyses, modellen, scenario’s, prioriteiten en portaalonderdelen te ordenen. Je kunt meerdere gebeurtenissen en doelen tegelijk kiezen.</p><div class="v2contextconfirm"><button type="button" class="pvprimary" data-context-confirm>Dit klopt</button><button type="button" data-context-edit>Pas situatie aan</button><span data-context-message>'+esc(message||'')+'</span></div></section>'
    +'<section class="v2legacyprofilecard" data-context-editor hidden><label class="v2contextfield"><span>Primaire bedrijfsfase</span><select data-context-stage>'+stageOptions(stage)+'</select></label><div class="v2contextgroup"><h4>Wat speelt er tegelijk?</h4>'+checkboxGrid(STRATEGIC_EVENTS,events,'events')+'</div><div class="v2contextgroup"><h4>Wat wil je bereiken?</h4>'+checkboxGrid(USER_GOALS,goals,'goals')+'</div>'+renderGoalTargets(state,goals)+'<div class="v2formactions"><button type="button" class="pvprimary" data-context-save>Opslaan & Powerhouse bijwerken</button><span data-context-save-message>De context en meetbare doelen worden tenant-scoped opgeslagen en gebruikt door het brein.</span></div></section>';
  return context;
}
function checkedValues(root,name){
  return Array.from(root.querySelectorAll('input[name="'+name+'"]:checked')).map(input=>input.value);
}
async function addScenarioActionToRoadmap(domainState,goalId,leverId){
  const state=domainState?.get?.()||{};
  const scenario=buildGoalScenarios(state,[goalId])[0];
  const action=scenario?.nextBestActions?.find(item=>item.leverId===leverId);
  if(!action)return {added:false,reason:'ACTION_NOT_FOUND'};
  const current=Array.isArray(domainState?.get?.('portal.roadmap.items'))?domainState.get('portal.roadmap.items'):[];
  const id='goal-'+goalId+'-'+leverId;
  if(current.some(item=>String(item?.id)===id))return {added:false,reason:'ALREADY_ON_ROADMAP'};
  const lever=scenario.levers.find(item=>item.id===leverId);
  const item={
    id,
    title:action.action,
    dimension:'Doel: '+(USER_GOALS[goalId]?.label||goalId),
    owner:'',
    progress:0,
    sprint:1,
    start:1,
    duration:1,
    done:false,
    status:'Gepland',
    source:'goal-scenario-cockpit',
    goalScenario:{
      goalId,
      leverId,
      target:scenario.target,
      targetDate:scenario.targetDate,
      expectedEffect:action.effect,
      unit:action.unit,
      evidenceMode:action.evidenceMode,
      sourceRefs:[...(lever?.sourceRefs||[])]
    }
  };
  domainState?.set?.('portal.roadmap.items',[...current,item]);
  await domainState?.flush?.();
  return {added:true,item};
}

async function persistContext(domainState,{stage,events,goals,targetStage,goalTargets,goalScenarios}){
  domainState?.set?.('portal.business_context.stage',stage);
  domainState?.set?.('portal.business_context.events',events);
  domainState?.set?.('portal.business_context.goals',goals);
  if(targetStage!==undefined)domainState?.set?.('portal.business_context.target_stage',targetStage||null);
  if(goalTargets!==undefined)domainState?.set?.('portal.business_context.goal_targets',goalTargets||{});
  if(goalScenarios!==undefined)domainState?.set?.('portal.business_context.goal_scenarios',goalScenarios||{});
  domainState?.patch?.('portal.business_context',{confirmed:true,confirmed_at:new Date().toISOString(),confirmation_source:'entrepreneur'});
  return domainState?.flush?.();
}

export function mountBusinessContextWorkspace(root,{domainState,onSaveStatus,onUpdated,openPage}={}){
  if(!root?.querySelectorAll)throw new TypeError('BUSINESS_CONTEXT_ROOT_REQUIRED');
  let destroyed=false;
  const draw=(message='')=>{
    if(destroyed)return;
    const state=domainState?.get?.()||{};
    renderForm(root,state,message);
    const editor=root.querySelector('[data-context-editor]');
    root.querySelector('[data-context-edit]')?.addEventListener('click',()=>{if(editor)editor.hidden=false;});
    root.querySelector('[data-context-target-stage]')?.addEventListener('change',event=>{domainState?.set?.('portal.business_context.target_stage',event.target.value||null);});
    root.querySelectorAll('[data-scenario-open]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.scenarioOpen)));
    root.querySelectorAll('[data-outcome-open]').forEach(button=>button.addEventListener('click',()=>openPage?.(button.dataset.outcomeOpen)));
    root.querySelectorAll('[data-scenario-roadmap]').forEach(button=>button.addEventListener('click',async()=>{
      try{
        onSaveStatus?.('saving');
        const result=await addScenarioActionToRoadmap(domainState,button.dataset.scenarioRoadmap,button.dataset.leverId);
        onSaveStatus?.('saved');
        draw(result.added?'Actie toegevoegd aan de roadmap.':'Deze actie staat al op de roadmap.');
        onUpdated?.();
      }catch(error){
        onSaveStatus?.('error');
        draw('Actie kon niet aan de roadmap worden toegevoegd.');
      }
    }));
    root.querySelector('[data-context-confirm]')?.addEventListener('click',async()=>{
      try{
        onSaveStatus?.('saving');
        const current=buildBusinessContext(domainState?.get?.()||{});
        await persistContext(domainState,{stage:current.primary.stage,events:[...current.events],goals:[...current.goals],targetStage:domainState?.get?.('portal.business_context.target_stage')||null,goalTargets:domainState?.get?.('portal.business_context.goal_targets')||{},goalScenarios:domainState?.get?.('portal.business_context.goal_scenarios')||{}});
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
      const targetStage=root.querySelector('[data-context-target-stage]')?.value||domainState?.get?.('portal.business_context.target_stage')||null;
      const goalTargets=collectGoalTargets(root,goals,domainState?.get?.('portal.business_context.goal_targets')||{});
      const goalScenarios=collectGoalScenarios(root,goals,domainState?.get?.('portal.business_context.goal_scenarios')||{});
      const message=root.querySelector('[data-context-save-message]');
      try{
        onSaveStatus?.('saving');
        if(message)message.textContent='Opslaan…';
        await persistContext(domainState,{stage,events,goals,targetStage,goalTargets,goalScenarios});
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
