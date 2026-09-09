const clone=value=>value==null?value:structuredClone(value);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const DEFAULT_SPRINTS=4;

function normalizeSprint(value,sprints=DEFAULT_SPRINTS){
 if(value==='backlog'||typeof value!=='number')return 'backlog';
 return Math.min(Math.max(1,Math.round(value)),Math.max(1,Number(sprints)||DEFAULT_SPRINTS));
}
export function normalizeDeliveryState(value={}){
 const state=value&&typeof value==='object'?clone(value):{};
 const sprints=Math.max(1,Math.min(12,Number(state.sprints)||DEFAULT_SPRINTS));
 const features=(Array.isArray(state.features)?state.features:[]).map((feature,index)=>({...feature,id:String(feature?.id||`feature-${index+1}`),title:String(feature?.title||'Feature'),sprint:normalizeSprint(feature?.sprint,sprints)}));
 const stories=(Array.isArray(state.stories)?state.stories:[]).map((story,index)=>({...story,id:String(story?.id||`story-${index+1}`),feature:String(story?.feature||''),role:String(story?.role||''),wish:String(story?.wish??story?.wens??''),reason:String(story?.reason??story?.reden??'')}));
 return {...state,sprints,features,stories};
}
export function moveFeatureToSprint(state,featureId,sprint){
 const next=normalizeDeliveryState(state);const target=normalizeSprint(sprint,next.sprints);
 next.features=next.features.map(feature=>feature.id===String(featureId)?{...feature,sprint:target}:feature);
 return next;
}
export function moveStoryToFeature(state,storyId,featureId){
 const next=normalizeDeliveryState(state);
 if(!next.features.some(feature=>feature.id===String(featureId)))return next;
 next.stories=next.stories.map(story=>story.id===String(storyId)?{...story,feature:String(featureId)}:story);
 return next;
}

function storyMarkup(story,features){
 const options=features.map(feature=>`<option value="${esc(feature.id)}" ${feature.id===story.feature?'selected':''}>${esc(feature.title)}</option>`).join('');
 return `<article class="v2deliverystory" draggable="true" data-story="${esc(story.id)}">
  <span class="v2deliveryhandle" aria-hidden="true">⠿</span>
  <div><small>User story</small><p>Als <b>${esc(story.role||'gebruiker')}</b> wil ik ${esc(story.wish||'…')}, zodat ${esc(story.reason||'…')}.</p></div>
  <label class="v2deliverymobilemove">Verplaats<select data-move-story aria-label="Verplaats user story ${esc(story.id)}">${options}</select></label>
 </article>`;
}
function featureMarkup(feature,state,index){
 const stories=state.stories.filter(story=>story.feature===feature.id);
 const pos=feature.sprint==='backlog'?0:Number(feature.sprint);
 return `<article class="v2deliveryfeature e${index%8}" draggable="true" data-feature="${esc(feature.id)}" data-sprint="${esc(feature.sprint)}">
  <div class="v2deliveryfeaturehead"><span class="v2deliveryhandle" aria-hidden="true">⠿</span><div><small>Feature</small><b>${esc(feature.title)}</b>${feature.epic?`<span>${esc(feature.epic)}</span>`:''}</div></div>
  <div class="v2deliverystories" data-story-target="${esc(feature.id)}">${stories.map(story=>storyMarkup(story,state.features)).join('')||'<p class="v2deliveryempty">Sleep een user story hierheen</p>'}</div>
  <div class="v2deliveryfeatureactions"><button type="button" data-add-story="${esc(feature.id)}">+ user story</button><div><button type="button" data-move-feature="left" ${pos===0?'disabled':''} aria-label="Feature naar vorige sprint">←</button><button type="button" data-move-feature="right" ${pos>=state.sprints?'disabled':''} aria-label="Feature naar volgende sprint">→</button></div></div>
 </article>`;
}
function boardMarkup(state){
 const columns=['backlog',...Array.from({length:state.sprints},(_,index)=>index+1)];
 return `<div class="v2deliverytoolbar"><div><strong>Deliveryboard</strong><span>Features tussen backlog en sprints; stories tussen features.</span></div><button type="button" data-add-feature>+ Feature</button></div><div class="v2deliveryboard" data-delivery-board>${columns.map(column=>{
  const features=state.features.filter(feature=>column==='backlog'?feature.sprint==='backlog':feature.sprint===column);
  return `<section class="v2deliverycolumn" data-sprint="${column}"><header><b>${column==='backlog'?'Backlog':`Sprint ${column}`}</b><small>${features.length} feature${features.length===1?'':'s'}</small></header><div class="v2deliverydrop" data-sprint="${column}">${features.map((feature,index)=>featureMarkup(feature,state,index)).join('')||'<p class="v2deliveryempty">Nog leeg</p>'}</div></section>`;
 }).join('')}</div>`;
}

export function mountDeliveryBoard(root,{domainState,statePath='portal.roadmap.delivery',onSaveStatus}={}){
 if(!root?.replaceChildren)throw new TypeError('DELIVERY_BOARD_ROOT_REQUIRED');
 if(!domainState?.get||!domainState?.set)throw new TypeError('DELIVERY_DOMAIN_STATE_REQUIRED');
 let state=normalizeDeliveryState(domainState.get(statePath)||{});let draggedFeature=null;let draggedStory=null;let saveTimer=null;
 const persist=next=>{
  state=normalizeDeliveryState(next);domainState.set(statePath,state);onSaveStatus?.(domainState.status?.()||'dirty');
  clearTimeout(saveTimer);saveTimer=setTimeout(()=>domainState.flush?.().then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error')),250);
  render();
 };
 const render=()=>{
  root.innerHTML=boardMarkup(state);
  root.querySelector('[data-add-feature]')?.addEventListener('click',()=>persist({...state,features:[...state.features,{id:`feature-${Date.now()}`,title:'Nieuwe feature',sprint:'backlog',epic:'',value:0}]}));
  root.querySelectorAll('[data-add-story]').forEach(button=>button.addEventListener('click',()=>persist({...state,stories:[...state.stories,{id:`story-${Date.now()}`,feature:button.dataset.addStory,role:'gebruiker',wish:'een resultaat',reason:'het werk beter gaat'}]})));
  root.querySelectorAll('[data-feature]').forEach(card=>{
   const id=card.dataset.feature;
   card.addEventListener('dragstart',event=>{if(event.target.closest?.('[data-story]'))return;draggedFeature=id;draggedStory=null;card.classList.add('dragging');event.dataTransfer?.setData('text/plain',`F:${id}`);});
   card.addEventListener('dragend',()=>{draggedFeature=null;card.classList.remove('dragging');});
   card.querySelectorAll('[data-move-feature]').forEach(button=>button.addEventListener('click',()=>{
    const pos=card.dataset.sprint==='backlog'?0:Number(card.dataset.sprint);const next=button.dataset.moveFeature==='left'?pos-1:pos+1;persist(moveFeatureToSprint(state,id,next<=0?'backlog':next));
   }));
  });
  root.querySelectorAll('[data-story]').forEach(card=>{
   const id=card.dataset.story;
   card.addEventListener('dragstart',event=>{event.stopPropagation();draggedStory=id;draggedFeature=null;card.classList.add('dragging');event.dataTransfer?.setData('text/plain',`S:${id}`);});
   card.addEventListener('dragend',()=>{draggedStory=null;card.classList.remove('dragging');});
   card.querySelector('[data-move-story]')?.addEventListener('change',event=>persist(moveStoryToFeature(state,id,event.target.value)));
  });
  root.querySelectorAll('[data-story-target]').forEach(target=>{
   target.addEventListener('dragover',event=>{if(!draggedStory)return;event.preventDefault();event.stopPropagation();target.classList.add('dragover');});
   target.addEventListener('dragleave',()=>target.classList.remove('dragover'));
   target.addEventListener('drop',event=>{if(!draggedStory)return;event.preventDefault();event.stopPropagation();target.classList.remove('dragover');persist(moveStoryToFeature(state,draggedStory,target.dataset.storyTarget));});
  });
  root.querySelectorAll('.v2deliverydrop').forEach(column=>{
   column.addEventListener('dragover',event=>{if(!draggedFeature)return;event.preventDefault();column.classList.add('dragover');});
   column.addEventListener('dragleave',()=>column.classList.remove('dragover'));
   column.addEventListener('drop',event=>{if(!draggedFeature)return;event.preventDefault();column.classList.remove('dragover');const sprint=column.dataset.sprint==='backlog'?'backlog':Number(column.dataset.sprint);persist(moveFeatureToSprint(state,draggedFeature,sprint));});
  });
 };
 render();
 return Object.freeze({getState:()=>normalizeDeliveryState(state),moveFeature:(id,sprint)=>persist(moveFeatureToSprint(state,id,sprint)),moveStory:(id,feature)=>persist(moveStoryToFeature(state,id,feature))});
}
