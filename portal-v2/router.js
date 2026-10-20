import { navigationUrl } from './navigation-model.js';

let route={target:'overzicht'};
let handlers={openPage:null,openHub:null,closeHub:null,showOverview:null};
const listeners=new Set();
let popstateBound=false;
let navigationDelegationBound=false;

export function currentPortalRoute(){ return {...route}; }
export function subscribePortalRoute(listener){ listeners.add(listener); return ()=>listeners.delete(listener); }

function readTargetFromLocation(){
  const params=new URLSearchParams(globalThis.location?.search || '');
  const hub=params.get('hub');
  if(hub) return `hub:${hub}`;
  return params.get('page') || 'overzicht';
}

function updateActiveState(target){
  document.querySelectorAll('[data-nav-target]').forEach(button=>{
    const active=button.dataset.navTarget===target;
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
  // Event delegation lives on the stable sidebar container. The customer
  // state subscription rebuilds its child buttons after hydration/login;
  // direct listeners on those old buttons would be silently lost.
  if(!navigationDelegationBound){
    const nav=document.querySelector('.sidebar .nav');
    if(nav){
      nav.addEventListener('click',event=>{
        const button=event.target?.closest?.('[data-nav-target]');
        if(button&&nav.contains(button))navigatePortal(button.dataset.navTarget);
      });
      navigationDelegationBound=true;
    }
  }
  if(!popstateBound){
    addEventListener('popstate',()=>applyTarget(readTargetFromLocation()));
    popstateBound=true;
  }
  const initialTarget=readTargetFromLocation();
  history.replaceState({portalTarget:initialTarget},'',navigationUrl(initialTarget));
  applyTarget(initialTarget);
}
