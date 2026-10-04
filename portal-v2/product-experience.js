const EXPERIENCE_VERSION='portal-product-experience-v1';
const visualSelectors=[
  '.v2visualgrid','.pvvisual','.legacy-insight-card','.adoption-card','.csrd-world',
  '[class*="chart"]','[class*="graph"]','[class*="visual"]'
].join(',');

function signal(type,detail={}){
  window.dispatchEvent(new CustomEvent('bg:portal-experience-signal',{detail:{version:EXPERIENCE_VERSION,type,at:new Date().toISOString(),...detail}}));
}

function ensureLiveRegion(){
  let live=document.querySelector('.portal-experience-live');
  if(live)return live;
  live=document.createElement('div');
  live.className='portal-experience-live';
  live.setAttribute('aria-live','polite');
  live.setAttribute('aria-atomic','true');
  document.body.append(live);
  return live;
}

function decorateVisuals(root=document){
  const nodes=[];
  if(root instanceof Element && root.matches(visualSelectors))nodes.push(root);
  if(root.querySelectorAll)nodes.push(...root.querySelectorAll(visualSelectors));
  for(const node of nodes){
    if(node.hasAttribute('data-portal-visual'))continue;
    const scroll=/table|adoption/i.test(node.className||'') || node.querySelector('table');
    node.setAttribute('data-portal-visual',scroll?'scroll':'fit');
  }
}

function measureVisual(node){
  const target=node.querySelector?.('svg,canvas,img,video,table');
  if(!target)return;
  const host=node.getBoundingClientRect();
  const child=target.getBoundingClientRect();
  const overflow=child.width-host.width>2;
  node.toggleAttribute('data-portal-visual-overflow',overflow);
  if(overflow)signal('visual_overflow',{width:Math.round(child.width),containerWidth:Math.round(host.width),className:String(node.className||'').slice(0,160)});
}

function measureAll(){
  document.querySelectorAll('[data-portal-visual]').forEach(measureVisual);
}

function routeLabel(target){
  if(!target)return 'Overzicht';
  const hit=document.querySelector(`[data-nav-target="${CSS.escape(target)}"]`);
  return hit?.textContent?.trim()||target.replace(/^hub:/,'');
}

function bindInteractionSignals(){
  document.addEventListener('click',event=>{
    const control=event.target.closest('button,a,[role="button"]');
    if(!control)return;
    const target=control.dataset?.openPage||control.dataset?.navTarget||control.getAttribute('href')||'';
    if(target){
      signal('interaction',{target:String(target).slice(0,220)});
      if(control.dataset?.openPage||control.dataset?.navTarget){
        document.documentElement.classList.add('portal-route-pending');
        ensureLiveRegion().textContent=`${routeLabel(target)} openen`;
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          document.documentElement.classList.remove('portal-route-pending');
          ensureLiveRegion().textContent=`${routeLabel(target)} geopend`;
        }));
      }
    }
  },{passive:true});
}

function bootstrap(){
  document.documentElement.classList.add('portal-experience-v1');
  decorateVisuals();
  measureAll();
  bindInteractionSignals();

  const resize=new ResizeObserver(entries=>entries.forEach(entry=>{
    const visual=entry.target.closest?.('[data-portal-visual]')||entry.target;
    if(visual?.matches?.('[data-portal-visual]'))measureVisual(visual);
  }));
  document.querySelectorAll('[data-portal-visual]').forEach(node=>resize.observe(node));

  const mutations=new MutationObserver(records=>{
    let changed=false;
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof Element))continue;
        decorateVisuals(node);
        changed=true;
      }
    }
    if(changed){
      document.querySelectorAll('[data-portal-visual]').forEach(node=>resize.observe(node));
      requestAnimationFrame(measureAll);
    }
  });
  mutations.observe(document.body,{childList:true,subtree:true});

  window.addEventListener('error',event=>signal('runtime_error',{message:String(event.message||'onbekende fout').slice(0,300)}));
  window.addEventListener('unhandledrejection',event=>signal('runtime_rejection',{message:String(event.reason?.message||event.reason||'onbekende fout').slice(0,300)}));
  window.addEventListener('popstate',()=>requestAnimationFrame(measureAll));
  window.addEventListener('resize',()=>requestAnimationFrame(measureAll),{passive:true});
  signal('experience_ready',{viewport:{width:innerWidth,height:innerHeight},route:location.pathname+location.search});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
else bootstrap();
