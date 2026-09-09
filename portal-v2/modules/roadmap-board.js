const cloneItems=items=>(Array.isArray(items)?items:[]).map((item,index)=>({...item,id:String(item?.id||`roadmap-${index+1}`),sprint:Math.min(12,Math.max(1,Number(item?.sprint??item?.start??1)||1))}));
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const clampSprint=value=>Math.min(12,Math.max(1,Number(value)||1));

export function moveRoadmapItem(items,id,sprint){
 const target=clampSprint(sprint);
 return cloneItems(items).map(item=>item.id===String(id)?{...item,sprint:target}:item);
}

export function reorderRoadmapItems(items,sourceId,targetId){
 const next=cloneItems(items);const from=next.findIndex(item=>item.id===String(sourceId));const to=next.findIndex(item=>item.id===String(targetId));
 if(from<0||to<0||from===to)return next;
 const [moved]=next.splice(from,1);next.splice(to,0,moved);return next;
}

function cardMarkup(item){
 const sprint=clampSprint(item.sprint);
 return `<article class="v2roadmapcard" draggable="true" data-roadmap-id="${esc(item.id)}" data-sprint="${sprint}">
  <div class="v2roadmapdrag" aria-hidden="true">⠿</div>
  <label>Titel<input data-card-field="title" value="${esc(item.title||'')}" aria-label="Titel roadmapkaart"></label>
  <div class="v2roadmapmeta">
   <label>Onderdeel<input data-card-field="dimension" value="${esc(item.dimension||'')}"></label>
   <label>Eigenaar<input data-card-field="owner" value="${esc(item.owner||'')}"></label>
  </div>
  <label>Voortgang <output>${Number(item.progress)||0}%</output><input type="range" min="0" max="100" step="5" data-card-field="progress" value="${Number(item.progress)||0}"></label>
  <div class="v2roadmapmove"><button type="button" data-move-left aria-label="Verplaats kaart naar vorige sprint">←</button><span>Sprint ${sprint}</span><button type="button" data-move-right aria-label="Verplaats kaart naar volgende sprint">→</button></div>
 </article>`;
}

function boardMarkup(items){
 const lanes=Array.from({length:12},(_,index)=>index+1).map(sprint=>{
  const cards=items.filter(item=>clampSprint(item.sprint)===sprint).map(cardMarkup).join('');
  return `<section class="v2roadmaplane" data-sprint="${sprint}" aria-label="Sprint ${sprint}"><header><b>Sprint ${sprint}</b><small>${items.filter(item=>clampSprint(item.sprint)===sprint).length} kaart(en)</small></header><div class="v2roadmapdrop" data-sprint="${sprint}">${cards||'<p class="v2roadmapempty">Sleep of verplaats een kaart hierheen</p>'}</div></section>`;
 }).join('');
 return `<div class="v2roadmaptoolbar"><div><strong>Uitvoeringsbord</strong><span>Sleep op desktop; gebruik pijlen op mobiel.</span></div><button type="button" data-add-roadmap>+ Kaart toevoegen</button></div><div class="v2roadmapboard" data-roadmap-board>${lanes}</div>`;
}

export function mountRoadmapBoard(root,{domainState,onSaveStatus}={}){
 if(!root?.replaceChildren)throw new TypeError('ROADMAP_BOARD_ROOT_REQUIRED');
 if(!domainState?.get||!domainState?.set)throw new TypeError('ROADMAP_DOMAIN_STATE_REQUIRED');
 let items=cloneItems(domainState.get('portal.roadmap.items')||[]);let draggedId=null;let saveTimer=null;
 const persist=next=>{
  items=cloneItems(next);domainState.set('portal.roadmap.items',items);onSaveStatus?.(domainState.status?.()||'dirty');
  clearTimeout(saveTimer);saveTimer=setTimeout(()=>domainState.flush?.().then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error')),250);
  render();
 };
 const updateCard=(id,field,value)=>persist(items.map(item=>item.id===id?{...item,[field]:field==='progress'?Number(value)||0:value}:item));
 const render=()=>{
  root.innerHTML=boardMarkup(items);
  root.querySelector('[data-add-roadmap]')?.addEventListener('click',()=>persist([...items,{id:`roadmap-${Date.now()}`,title:'Nieuw roadmap-item',dimension:'',owner:'',progress:0,sprint:1,start:1,duration:1,done:false}]));
  root.querySelectorAll('.v2roadmapcard').forEach(card=>{
   const id=card.dataset.roadmapId;
   card.addEventListener('dragstart',event=>{draggedId=id;card.classList.add('dragging');event.dataTransfer?.setData('text/plain',id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';});
   card.addEventListener('dragend',()=>{draggedId=null;card.classList.remove('dragging');root.querySelectorAll('.dragover').forEach(node=>node.classList.remove('dragover'));});
   card.addEventListener('dragover',event=>{event.preventDefault();card.classList.add('dragover');});
   card.addEventListener('dragleave',()=>card.classList.remove('dragover'));
   card.addEventListener('drop',event=>{event.preventDefault();event.stopPropagation();card.classList.remove('dragover');const source=draggedId||event.dataTransfer?.getData('text/plain');if(!source||source===id)return;const sprint=Number(card.dataset.sprint);persist(reorderRoadmapItems(moveRoadmapItem(items,source,sprint),source,id));});
   card.querySelector('[data-move-left]')?.addEventListener('click',()=>{const current=Number(card.dataset.sprint);if(current>1)persist(moveRoadmapItem(items,id,current-1));});
   card.querySelector('[data-move-right]')?.addEventListener('click',()=>{const current=Number(card.dataset.sprint);if(current<12)persist(moveRoadmapItem(items,id,current+1));});
   card.querySelectorAll('[data-card-field]').forEach(input=>{
    const commit=()=>updateCard(id,input.dataset.cardField,input.value);
    input.addEventListener(input.type==='range'?'change':'change',commit);
    if(input.type==='range')input.addEventListener('input',()=>{const output=input.closest('label')?.querySelector('output');if(output)output.textContent=`${input.value}%`;});
   });
  });
  root.querySelectorAll('.v2roadmapdrop').forEach(lane=>{
   lane.addEventListener('dragover',event=>{event.preventDefault();lane.classList.add('dragover');});
   lane.addEventListener('dragleave',()=>lane.classList.remove('dragover'));
   lane.addEventListener('drop',event=>{event.preventDefault();lane.classList.remove('dragover');const source=draggedId||event.dataTransfer?.getData('text/plain');if(source)persist(moveRoadmapItem(items,source,Number(lane.dataset.sprint)));});
  });
 };
 render();return Object.freeze({getItems:()=>cloneItems(items),move:(id,sprint)=>persist(moveRoadmapItem(items,id,sprint)),reorder:(source,target)=>persist(reorderRoadmapItems(items,source,target))});
}
