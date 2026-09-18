import { ensureInteractionParityStyles } from './interaction-parity-style.js';

export const OVERVIEW_BLOCKS=Object.freeze([
  Object.freeze({id:'kpis',selector:'.kpis',label:'Kerncijfers',defaultSize:'full'}),
  Object.freeze({id:'insights',selector:'[data-legacy-overview-insights]',label:'Stand van je bedrijf',defaultSize:'full'}),
  Object.freeze({id:'intelligence',selector:'.dashboard',label:'Brein & management',defaultSize:'full'}),
  Object.freeze({id:'execution',selector:'.lower',label:'Roadmap, kansen & impact',defaultSize:'full'}),
  Object.freeze({id:'questions',selector:'.dv-houder',label:'Verdiepende vragen',defaultSize:'full'}),
  Object.freeze({id:'activities',selector:'.activities',label:'Recente activiteiten',defaultSize:'full'})
]);
const validIds=new Set(OVERVIEW_BLOCKS.map(block=>block.id));
const defaultOrder=Object.freeze(OVERVIEW_BLOCKS.map(block=>block.id));

export function reorderOverviewBlocks(blocks,sourceId,targetId){
  const next=(Array.isArray(blocks)?blocks:[]).map(String);
  const from=next.indexOf(String(sourceId)),to=next.indexOf(String(targetId));
  if(from<0||to<0||from===to)return next;
  const [moved]=next.splice(from,1);next.splice(to,0,moved);return next;
}

export function normalizeOverviewOrder(order=[]){
  return [...(Array.isArray(order)?order:[]).map(String),...defaultOrder]
    .filter((id,index,list)=>validIds.has(id)&&list.indexOf(id)===index);
}

function viewportMode(){
  return globalThis.matchMedia?.('(max-width: 760px)')?.matches?'mobile':'desktop';
}
function orderPath(mode){return `portal.overview.layouts.${mode}.order`;}
function sizePath(mode){return `portal.overview.layouts.${mode}.sizes`;}

function addControls(doc,node,block,index,total,mode,size){
  node.dataset.overviewBlock=block.id;
  node.dataset.overviewSize=size;
  node.draggable=false;
  let controls=node.querySelector(':scope > .v2overviewcontrols');
  if(!controls){
    controls=doc.createElement('div');
    controls.className='v2overviewcontrols';
    node.prepend(controls);
  }
  controls.innerHTML=
    `<button type="button" class="v2overviewdrag" data-overview-drag aria-label="Sleep ${block.label} naar een andere plek" title="Slepen">⠿</button>`
    +`<span class="v2overviewlabel">${block.label}</span>`
    +`<button type="button" data-overview-move-prev aria-label="Verplaats ${block.label} ${mode==='mobile'?'omhoog':'naar links of eerder'}" ${index===0?'disabled':''}>${mode==='mobile'?'↑':'←'}</button>`
    +`<button type="button" data-overview-move-next aria-label="Verplaats ${block.label} ${mode==='mobile'?'omlaag':'naar rechts of later'}" ${index===total-1?'disabled':''}>${mode==='mobile'?'↓':'→'}</button>`
    +(mode==='desktop'? `<button type="button" data-overview-size aria-label="Wijzig breedte van ${block.label}" title="Wissel halve/volle breedte">${size==='half'?'↔ Vol':'↔ Half'}</button>`:'');
}

function createCustomizer(doc,main){
  let toolbar=main.querySelector(':scope > .v2overviewcustomizer');
  if(toolbar)return toolbar;
  toolbar=doc.createElement('section');
  toolbar.className='v2overviewcustomizer';
  toolbar.setAttribute('aria-label','Overzicht aanpassen');
  toolbar.innerHTML='<button type="button" data-overview-edit aria-pressed="false">⚙ Overzicht aanpassen</button><span data-overview-help>Versleep blokken of gebruik de pijlen. Jouw indeling wordt per apparaat onthouden.</span><button type="button" data-overview-reset>Standaard herstellen</button>';
  const topbar=main.querySelector(':scope > .topbar');
  (topbar||main.firstElementChild)?.after?.(toolbar);
  if(!toolbar.parentNode)main.prepend(toolbar);
  return toolbar;
}

function buildCanvas(doc,main,nodes){
  let canvas=main.querySelector(':scope > .v2overviewcanvas');
  if(!canvas){
    canvas=doc.createElement('div');
    canvas.className='v2overviewcanvas';
    const toolbar=main.querySelector(':scope > .v2overviewcustomizer');
    (toolbar||main.querySelector(':scope > .topbar'))?.after(canvas);
    if(!canvas.parentNode)main.append(canvas);
  }
  nodes.forEach(node=>{if(node.parentNode!==canvas)canvas.append(node);});
  return canvas;
}

export function mountOverviewReorder(root=document,{domainState,onSaveStatus}={}){
  if(!root?.querySelector)throw new TypeError('OVERVIEW_REORDER_ROOT_REQUIRED');
  if(!domainState?.get||!domainState?.set)throw new TypeError('OVERVIEW_DOMAIN_STATE_REQUIRED');
  const main=root.querySelector('.main');if(!main)return null;
  const doc=main.ownerDocument||root;ensureInteractionParityStyles(doc);

  const nodeEntries=OVERVIEW_BLOCKS.map(block=>[block.id,root.querySelector(block.selector)]).filter(([,node])=>Boolean(node));
  const nodes=new Map(nodeEntries);
  if(nodes.size<2)return null;

  const toolbar=createCustomizer(doc,main);
  const canvas=buildCanvas(doc,main,[...nodes.values()]);
  let mode=viewportMode(),editing=false,draggedId=null,touchId=null,saveTimer=null;
  const readOrder=()=>{
    const stored=domainState.get(orderPath(mode));
    const legacy=domainState.get('portal.overview.blockOrder');
    return normalizeOverviewOrder(Array.isArray(stored)?stored:legacy).filter(id=>nodes.has(id));
  };
  const readSizes=()=>domainState.get(sizePath(mode))||{};
  let order=readOrder(),sizes=readSizes();

  const flush=()=>{
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>domainState.flush?.().then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error')),200);
  };
  const persist=()=>{
    domainState.set(orderPath(mode),order);
    domainState.set(sizePath(mode),sizes);
    onSaveStatus?.(domainState.status?.()||'dirty');
    flush();
  };
  const setEditing=value=>{
    editing=Boolean(value);
    canvas.classList.toggle('is-editing',editing);
    toolbar.classList.toggle('is-editing',editing);
    toolbar.querySelector('[data-overview-edit]')?.setAttribute('aria-pressed',String(editing));
    toolbar.querySelector('[data-overview-edit]').textContent=editing?'✓ Klaar':'⚙ Overzicht aanpassen';
    bind();
  };
  const applyOrder=next=>{
    order=normalizeOverviewOrder(next).filter(id=>nodes.has(id));
    for(const id of order)canvas.append(nodes.get(id));
    bind();
  };
  const moveBy=(id,offset)=>{
    const index=order.indexOf(id),target=index+offset;
    if(index<0||target<0||target>=order.length)return;
    order=reorderOverviewBlocks(order,id,order[target]);applyOrder(order);persist();
  };
  const toggleSize=id=>{
    if(mode!=='desktop')return;
    sizes={...sizes,[id]:(sizes[id]||'full')==='half'?'full':'half'};
    bind();persist();
  };
  const dropAt=(source,target)=>{
    if(!source||!target||source===target)return;
    order=reorderOverviewBlocks(order,source,target);applyOrder(order);persist();
  };
  const targetFromPoint=(x,y)=>{
    const el=doc.elementFromPoint?.(x,y);
    return el?.closest?.('[data-overview-block]')?.dataset?.overviewBlock||null;
  };

  function bind(){
    order.forEach((id,index)=>{
      const node=nodes.get(id),block=OVERVIEW_BLOCKS.find(item=>item.id===id);if(!node||!block)return;
      const size=mode==='desktop'?(sizes[id]||block.defaultSize||'full'):'full';
      addControls(doc,node,block,index,order.length,mode,size);
      node.classList.toggle('v2overvieweditable',editing);
      const handle=node.querySelector(':scope > .v2overviewcontrols [data-overview-drag]');
      node.draggable=editing&&mode==='desktop';
      node.ondragstart=editing&&mode==='desktop'?event=>{
        draggedId=id;node.classList.add('dragging');
        event.dataTransfer?.setData('text/plain',id);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';
      }:null;
      node.ondragend=()=>{
        draggedId=null;node.classList.remove('dragging');nodes.forEach(item=>item.classList.remove('dragover'));
      };
      node.ondragover=editing?event=>{event.preventDefault();node.classList.add('dragover');}:null;
      node.ondragleave=()=>node.classList.remove('dragover');
      node.ondrop=editing?event=>{
        event.preventDefault();event.stopPropagation();node.classList.remove('dragover');
        dropAt(draggedId||event.dataTransfer?.getData('text/plain'),id);
      }:null;

      if(handle){
        handle.onpointerdown=editing?event=>{
          if(event.pointerType==='mouse'&&mode==='desktop')return;
          touchId=id;handle.setPointerCapture?.(event.pointerId);node.classList.add('dragging');
          event.preventDefault();
        }:null;
        handle.onpointermove=editing?event=>{
          if(!touchId)return;
          const target=targetFromPoint(event.clientX,event.clientY);
          nodes.forEach(item=>item.classList.toggle('dragover',item.dataset.overviewBlock===target&&target!==touchId));
        }:null;
        handle.onpointerup=editing?event=>{
          if(!touchId)return;
          const source=touchId,target=targetFromPoint(event.clientX,event.clientY);
          touchId=null;node.classList.remove('dragging');nodes.forEach(item=>item.classList.remove('dragover'));
          dropAt(source,target);
        }:null;
        handle.onpointercancel=()=>{touchId=null;node.classList.remove('dragging');nodes.forEach(item=>item.classList.remove('dragover'));};
      }
      node.querySelector(':scope > .v2overviewcontrols [data-overview-move-prev]')?.addEventListener('click',()=>moveBy(id,-1),{once:true});
      node.querySelector(':scope > .v2overviewcontrols [data-overview-move-next]')?.addEventListener('click',()=>moveBy(id,1),{once:true});
      node.querySelector(':scope > .v2overviewcontrols [data-overview-size]')?.addEventListener('click',()=>toggleSize(id),{once:true});
    });
  }

  toolbar.querySelector('[data-overview-edit]')?.addEventListener('click',()=>setEditing(!editing));
  toolbar.querySelector('[data-overview-reset]')?.addEventListener('click',()=>{
    order=defaultOrder.filter(id=>nodes.has(id));sizes={};applyOrder(order);persist();
  });

  const onViewportChange=()=>{
    const next=viewportMode();if(next===mode)return;
    mode=next;order=readOrder();sizes=readSizes();applyOrder(order);
  };
  globalThis.addEventListener?.('resize',onViewportChange,{passive:true});
  applyOrder(order);setEditing(false);

  const unsubscribe=domainState.subscribe?.(snapshot=>{
    const stored=snapshot?.state?.portal?.overview?.layouts?.[mode]?.order;
    if(Array.isArray(stored)&&stored.join('|')!==order.join('|'))applyOrder(stored);
  });
  return Object.freeze({
    getOrder:()=>[...order],
    getMode:()=>mode,
    reorder:(source,target)=>{dropAt(source,target);return [...order];},
    setEditing,
    reset:()=>toolbar.querySelector('[data-overview-reset]')?.click(),
    destroy:()=>{unsubscribe?.();globalThis.removeEventListener?.('resize',onViewportChange);}
  });
}
