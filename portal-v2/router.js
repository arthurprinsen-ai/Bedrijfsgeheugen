import { mobileTarget, navigationUrl, DESKTOP_NAV_GROUPS } from './navigation-model.js';

let route={target:'overzicht'};
let handlers={openPage:null,openHub:null,closeHub:null,showOverview:null};
const listeners=new Set();
let popstateBound=false;

export function currentPortalRoute(){ return {...route}; }
export function subscribePortalRoute(listener){ listeners.add(listener); return ()=>listeners.delete(listener); }

function readTargetFromLocation(){
  const params=new URLSearchParams(globalThis.location?.search || '');
  const hub=params.get('hub');
  if(hub) return `hub:${hub}`;
  return params.get('page') || 'overzicht';
}

function updateActiveState(target){
  const groupForTarget=DESKTOP_NAV_GROUPS.find(group=>group.target===target||group.pages?.some(page=>page.target===target));
  document.querySelectorAll('[data-nav-target]').forEach(button=>{
    const active=groupForTarget?button.dataset.navGroup===groupForTarget.id:button.dataset.navTarget===target;
    button.classList.toggle('active',active);
    if(active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-mobile-nav]').forEach(button=>{
    const mapped=mobileTarget(button.dataset.mobileNav);
    const active=mapped===target
      || (mapped==='hub:data-ai'&&['data','ai'].includes(groupForTarget?.id))
      || (mapped==='hub:tasks'&&groupForTarget?.id==='actions');
    button.classList.toggle('active',active);
    if(active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
}

function renderTarget(target){
  if(target==='overzicht'){
    handlers.closeHub?.();
    handlers.showOverview?.();
    return true;
  }
  if(target.startsWith('os:')){
    handlers.closeHub?.();
    handlers.showOverview?.();
    if(typeof document!=='undefined')document.dispatchEvent(new CustomEvent('bg:open-os-page',{detail:{pageId:target.slice(3)}}));
    return true;
  }
  if(target.startsWith('hub:')){
    handlers.openHub?.(target.slice(4));
    return true;
  }
  handlers.closeHub?.();
  return handlers.openPage?.(target) !== false;
}

function applyTarget(target){
  route={target};
  renderTarget(target);
  updateActiveState(target);
  for(const listener of listeners) listener(currentPortalRoute());
}

export function navigatePortal(target,{replace=false}={}){
  if(!target) return false;
  const url=navigationUrl(target);
  history[replace?'replaceState':'pushState']({portalTarget:target},'',url);
  applyTarget(target);
  return true;
}

export function bindPortalNavigation(nextHandlers={}){
  handlers={...handlers,...nextHandlers};
  document.querySelectorAll('[data-nav-target]').forEach(button=>{
    button.addEventListener('click',()=>navigatePortal(button.dataset.navTarget));
  });
  document.querySelectorAll('[data-mobile-nav]').forEach(button=>{
    button.addEventListener('click',()=>navigatePortal(mobileTarget(button.dataset.mobileNav)));
  });
  if(!popstateBound){
    addEventListener('popstate',()=>applyTarget(readTargetFromLocation()));
    popstateBound=true;
  }
  const initialTarget=readTargetFromLocation();
  history.replaceState({portalTarget:initialTarget},'',navigationUrl(initialTarget));
  applyTarget(initialTarget);
}
