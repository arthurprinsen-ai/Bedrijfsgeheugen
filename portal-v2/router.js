import { mobileTarget, navigationUrl } from './navigation-model.js';

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
  document.querySelectorAll('[data-nav-target]').forEach(button=>{
    const active=button.dataset.navTarget===target;
    button.classList.toggle('active',active);
    if(active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
  });
  document.querySelectorAll('[data-mobile-nav]').forEach(button=>{
    const active=mobileTarget(button.dataset.mobileNav)===target;
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
  applyTarget(readTargetFromLocation());
}
