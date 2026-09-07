const BUSINESS_OS_ROUTES=['Strategie','Groei','Operatie','Organisatie','Data & Technologie','Uitvoering','Mijn werk','Model Library','Trust & Governance','Beheer'];

function makeGroup(){
  const group=document.createElement('section');group.className='portal-nav-group portal-nav-group--business-os';
  group.innerHTML=`<h4>Business OS</h4>${BUSINESS_OS_ROUTES.map(route=>`<button type="button" data-route="${route}" data-business-os-route="${route}">${route}</button>`).join('')}`;
  group.addEventListener('click',event=>{if(!event.target.closest('[data-business-os-route]'))return;document.querySelector('#portalNavigationDrawer')?.classList.remove('is-open');document.querySelector('#portalMobileDrawer')?.classList.remove('is-open');document.body.classList.remove('portal-menu-open');document.querySelector('#mobileMenuToggle')?.setAttribute('aria-expanded','false');});
  return group;
}

export function mountBusinessOsNavigation(){
  for(const nav of document.querySelectorAll('[data-portal-nav-tree],#portalMobileNav')){
    if(nav.querySelector('.portal-nav-group--business-os'))continue;
    nav.prepend(makeGroup());
  }
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountBusinessOsNavigation);
  else mountBusinessOsNavigation();
}
