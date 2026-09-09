const BLOCKS=Object.freeze([
  Object.freeze({id:'kpis',selector:'.main > .kpis',label:'Kerncijfers'}),
  Object.freeze({id:'intelligence',selector:'.main > .dashboard',label:'Brein & management'}),
  Object.freeze({id:'execution',selector:'.main > .lower',label:'Roadmap, kansen & impact'}),
  Object.freeze({id:'activities',selector:'.main > .activities',label:'Recente activiteiten'})
]);
const validIds=new Set(BLOCKS.map(block=>block.id));

export function reorderOverviewBlocks(blocks,sourceId,targetId){
  const next=(Array.isArray(blocks)?blocks:[]).map(String);const from=next.indexOf(String(sourceId));const to=next.indexOf(String(targetId));
  if(from<0||to<0||from===to)return next;
  const [moved]=next.splice(from,1);next.splice(to,0,moved);return next;
}

function normalizeOrder(order=[]){
  return [...(Array.isArray(order)?order:[]).map(String),...BLOCKS.map(block=>block.id)].filter((id,index,list)=>validIds.has(id)&&list.indexOf(id)===index);
}

function addControls(node,block,index,total){
  node.dataset.overviewBlock=block.id;node.draggable=true;
  let controls=node.querySelector(':scope > .v2overviewcontrols');
  if(!controls){controls=document.createElement('div');controls.className='v2overviewcontrols';node.prepend(controls);}
  controls.innerHTML=`<span class="v2overviewdrag" aria-hidden="true">⠿</span><span class="v2overviewlabel">${block.label}</span><button type="button" data-overview-move-up aria-label="Verplaats ${block.label} omhoog" ${index===0?'disabled':''}>↑</button><button type="button" data-overview-move-down aria-label="Verplaats ${block.label} omlaag" ${index===total-1?'disabled':''}>↓</button>`;
}

export function mountOverviewReorder(root=document,{domainState,onSaveStatus}={}){
  if(!root?.querySelector)throw new TypeError('OVERVIEW_REORDER_ROOT_REQUIRED');
  if(!domainState?.get||!domainState?.set)throw new TypeError('OVERVIEW_DOMAIN_STATE_REQUIRED');
  const main=root.querySelector('.main');if(!main)return null;
  let order=normalizeOrder(domainState.get('portal.overview.blockOrder'));let draggedId=null;let saveTimer=null;
  const nodes=new Map(BLOCKS.map(block=>[block.id,root.querySelector(block.selector)]).filter(([,node])=>Boolean(node)));
  if(nodes.size<2)return null;
  const flush=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>domainState.flush?.().then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error')),250);};
  const applyOrder=next=>{
    order=normalizeOrder(next).filter(id=>nodes.has(id));
    const anchor=main.querySelector('.topbar');let previous=anchor;
    for(const id of order){const node=nodes.get(id);previous.after(node);previous=node;}
    bind();
  };
  const persist=next=>{order=normalizeOrder(next);domainState.set('portal.overview.blockOrder',order);onSaveStatus?.(domainState.status?.()||'dirty');applyOrder(order);flush();};
  const moveBy=(id,offset)=>{const index=order.indexOf(id);const target=index+offset;if(index<0||target<0||target>=order.length)return;persist(reorderOverviewBlocks(order,id,order[target]));};
  function bind(){
    order.forEach((id,index)=>{
      const node=nodes.get(id),block=BLOCKS.find(item=>item.id===id);if(!node||!block)return;
      addControls(node,block,index,order.length);
      node.ondragstart=event=>{draggedId=id;node.classList.add('dragging');event.dataTransfer?.setData('text/plain',id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';};
      node.ondragend=()=>{draggedId=null;node.classList.remove('dragging');nodes.forEach(item=>item.classList.remove('dragover'));};
      node.ondragover=event=>{event.preventDefault();node.classList.add('dragover');};
      node.ondragleave=()=>node.classList.remove('dragover');
      node.ondrop=event=>{event.preventDefault();event.stopPropagation();node.classList.remove('dragover');const source=draggedId||event.dataTransfer?.getData('text/plain');if(source&&source!==id)persist(reorderOverviewBlocks(order,source,id));};
      node.querySelector(':scope > .v2overviewcontrols [data-overview-move-up]')?.addEventListener('click',()=>moveBy(id,-1),{once:true});
      node.querySelector(':scope > .v2overviewcontrols [data-overview-move-down]')?.addEventListener('click',()=>moveBy(id,1),{once:true});
    });
  }
  applyOrder(order);
  const unsubscribe=domainState.subscribe?.(snapshot=>{const stored=snapshot?.state?.portal?.overview?.blockOrder;if(Array.isArray(stored)&&stored.join('|')!==order.join('|'))applyOrder(stored);});
  return Object.freeze({getOrder:()=>[...order],reorder:(source,target)=>persist(reorderOverviewBlocks(order,source,target)),destroy:()=>unsubscribe?.()});
}
