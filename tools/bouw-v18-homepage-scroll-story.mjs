import { readFile, writeFile } from 'node:fs/promises';

const HOME = 'index.html';
const STYLE_ID = 'homepage-scroll-story-style';
const SCRIPT_ID = 'homepage-scroll-story-script';

export function applyHomepageScrollStory(html) {
  const source = String(html || '');
  if (source.includes(`id="${SCRIPT_ID}"`)) return source;
  if (!source.includes('</head>') || !source.includes('</body>')) {
    throw new Error('Homepage scroll story: ongeldige HTML-shell');
  }

  const css = `<style id="${STYLE_ID}">
[data-bg-story-root]{position:relative;isolation:isolate}
[data-bg-story-step]{transition:opacity .22s ease,color .22s ease,transform .22s ease;opacity:.46!important}
[data-bg-story-step][data-bg-story-status="active"]{opacity:1!important;transform:translateX(4px)}
[data-bg-story-step][data-bg-story-status="done"]{opacity:.78!important}
[data-bg-story-step][data-bg-story-status="done"]::after{content:"✓";display:inline-grid;place-items:center;width:20px;height:20px;margin-left:9px;border-radius:50%;background:#DFF7E9;color:#087A45;font-size:12px;font-weight:900;vertical-align:middle}
[data-bg-story-step][aria-current="step"]{color:inherit!important}
[data-bg-story-visual]{position:relative!important;overflow:hidden}
[data-bg-story-overlay]{position:absolute;inset:0;z-index:15;display:grid;align-content:center;padding:clamp(22px,4vw,46px);background:linear-gradient(145deg,rgba(8,29,42,.985),rgba(13,39,51,.985));color:#fff;opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .28s ease,transform .28s ease,visibility .28s linear;border-radius:inherit}
[data-bg-story-overlay][data-show="1"]{opacity:1;visibility:visible;transform:none}
[data-bg-story-overlay] .bgss-kicker{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#93D7B4;font-weight:800;margin-bottom:10px}
[data-bg-story-overlay] h3{font:800 clamp(22px,2.3vw,34px)/1.08 "Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.025em;margin:0 0 12px;color:#fff}
[data-bg-story-overlay] p{font-size:14px;line-height:1.55;color:rgba(255,255,255,.72);max-width:48ch;margin:0 0 18px}
[data-bg-story-overlay] .bgss-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
[data-bg-story-overlay] .bgss-item{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.055);border-radius:12px;padding:11px 12px;min-width:0}
[data-bg-story-overlay] .bgss-item b{display:block;color:#fff;font-size:13px;line-height:1.25}
[data-bg-story-overlay] .bgss-item span{display:block;color:rgba(255,255,255,.57);font-size:11px;line-height:1.35;margin-top:3px}
[data-bg-story-overlay] .bgss-line{display:flex;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:12px}
[data-bg-story-overlay] .bgss-line:last-child{border-bottom:0}
[data-bg-story-overlay] .bgss-dot{width:8px;height:8px;border-radius:50%;background:#58D68D;flex:0 0 auto;box-shadow:0 0 0 5px rgba(88,214,141,.10)}
[data-bg-story-overlay] .bgss-state{margin-left:auto;font-size:10px;border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:3px 7px;color:rgba(255,255,255,.7)}
[data-bg-story-root][data-bg-story-state="0"] [data-bg-story-signal]{animation:bgssPulse 1.8s ease-in-out infinite}
@keyframes bgssPulse{0%,100%{box-shadow:0 0 0 0 rgba(88,214,141,0)}50%{box-shadow:0 0 0 7px rgba(88,214,141,.13)}}
html[data-bg-story-active="1"] [data-bg-story-cost]{opacity:0!important;pointer-events:none!important;transform:translateY(16px)!important;transition:opacity .18s ease,transform .18s ease!important}
@media(min-width:1024px){
  [data-bg-story-root]{padding-bottom:0!important}
}
@media(max-width:1023px){
  [data-bg-story-overlay]{position:relative;inset:auto;display:none;margin-top:12px;min-height:280px;border-radius:20px}
  [data-bg-story-overlay][data-show="1"]{display:grid}
  [data-bg-story-step]{opacity:.72!important}
  [data-bg-story-step][data-bg-story-status="active"],[data-bg-story-step][data-bg-story-status="done"]{opacity:1!important}
  html[data-bg-story-active="1"] [data-bg-story-cost]{opacity:1!important;pointer-events:auto!important;transform:none!important}
}
@media(prefers-reduced-motion:reduce){
  [data-bg-story-step],[data-bg-story-overlay],[data-bg-story-root][data-bg-story-state="0"] [data-bg-story-signal]{animation:none!important;transition:none!important;transform:none!important}
}
</style>`;

  const js = `<script id="${SCRIPT_ID}">
(function(){
  'use strict';
  var LABELS=['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat'];
  var FOURTH=['Effect wordt zichtbaar','Effect wordt gevolgd','Effect wordt gemeten','Impact wordt zichtbaar'];
  var state=0,ticking=false,root=null,visual=null,steps=[],overlays=[];

  function txt(el){return (el&&el.textContent||'').replace(/\\s+/g,' ').trim();}
  function exact(label,scope){return Array.prototype.find.call((scope||document).querySelectorAll('h1,h2,h3,h4,h5,h6,b,strong,span,p,div'),function(el){return txt(el)===label;})||null;}
  function common(a,b){var seen=[];for(var n=a;n;n=n.parentElement)seen.push(n);for(var m=b;m;m=m.parentElement)if(seen.indexOf(m)!==-1)return m;return null;}
  function containsOther(el,label){var t=txt(el);return LABELS.some(function(x){return x!==label&&t.indexOf(x)!==-1;});}
  function blockFor(el,label){var best=el;for(var n=el;n&&n.parentElement&&n.parentElement!==document.body;n=n.parentElement){var p=n.parentElement;if(containsOther(p,label))break;if(txt(p).length>520)break;best=p;}return best;}
  function smallestContaining(scope,needle){var found=null;Array.prototype.forEach.call((scope||document).querySelectorAll('div,aside,section'),function(el){var t=txt(el);if(t.indexOf(needle)===-1)return;if(!found||t.length<txt(found).length)found=el;});return found;}

  function findRoot(first,third,cta){
    var r=common(first,third);
    if(!r)return null;
    while(r&&r!==document.body){
      var t=txt(r);
      if(t.indexOf(LABELS[0])!==-1&&t.indexOf(LABELS[1])!==-1&&t.indexOf(LABELS[2])!==-1&&(cta?r.contains(cta):true))return r;
      r=r.parentElement;
    }
    return null;
  }

  function findFourth(scope){
    for(var i=0;i<FOURTH.length;i++){var hit=exact(FOURTH[i],scope);if(hit)return hit;}
    return Array.prototype.slice.call(scope.querySelectorAll('div,li,article')).find(function(el){var t=txt(el);return /^04(?:\\s|$)/.test(t)&&t.length<420;})||null;
  }

  function markCostWidget(){
    var cost=smallestContaining(document,'Sinds deze pagina opende')||smallestContaining(document,'Reken het na');
    if(cost)cost.setAttribute('data-bg-story-cost','');
  }

  function chooseVisual(cta){
    if(!cta)return null;
    var best=cta.parentElement;
    for(var n=cta.parentElement;n&&n!==root;n=n.parentElement){
      var r=n.getBoundingClientRect();
      if(r.width>=300&&r.height>=240){best=n;if(r.width>=430&&r.height>=330)break;}
    }
    return best;
  }

  function overlay(index,kicker,title,body,inner){
    var el=document.createElement('div');
    el.setAttribute('data-bg-story-overlay',String(index));
    el.setAttribute('aria-live','polite');
    el.innerHTML='<div class="bgss-kicker">'+kicker+'</div><h3>'+title+'</h3><p>'+body+'</p>'+inner;
    visual.appendChild(el);overlays[index]=el;
  }

  function createOverlays(){
    overlay(1,'Stap 02 · Voorbeeldimpact','Context wordt begrepen.','Bedrijfsgeheugen legt eerst de verbanden vast voordat er een actie ontstaat.','<div class="bgss-grid"><div class="bgss-item"><b>Processen</b><span>Welke werkwijze is afhankelijk?</span></div><div class="bgss-item"><b>Rollen</b><span>Wie neemt kennis en eigenaarschap over?</span></div><div class="bgss-item"><b>Documenten</b><span>Welke instructies moeten actueel blijven?</span></div><div class="bgss-item"><b>KPI’s</b><span>Waar kan het effect zichtbaar worden?</span></div></div>');
    overlay(2,'Stap 03 · Voorbeeldopvolging','Opvolging ontstaat.','De gevonden impact wordt vertaald naar concrete opvolging met eigenaar en status.','<div><div class="bgss-line"><i class="bgss-dot"></i><span>Kennisoverdracht vastleggen</span><span class="bgss-state">eigenaar bepalen</span></div><div class="bgss-line"><i class="bgss-dot"></i><span>Procesdocumentatie bijwerken</span><span class="bgss-state">open</span></div><div class="bgss-line"><i class="bgss-dot"></i><span>Afhankelijkheden controleren</span><span class="bgss-state">gepland</span></div></div>');
    overlay(3,'Stap 04 · Readback','Effect blijft zichtbaar.','Niet alleen de actie, maar ook wat is bijgewerkt, wat nog wacht en waar opnieuw aandacht nodig is.','<div class="bgss-grid"><div class="bgss-item"><b>Bijgewerkt</b><span>Nieuwe context is vastgelegd</span></div><div class="bgss-item"><b>Open</b><span>Wat nog bevestiging nodig heeft</span></div><div class="bgss-item"><b>Geraakt</b><span>KPI’s en processen blijven gekoppeld</span></div><div class="bgss-item"><b>Readback</b><span>De wijziging blijft traceerbaar</span></div></div>');
  }

  function setStoryState(next){
    next=Math.max(0,Math.min(3,Number(next)||0));state=next;
    root.setAttribute('data-bg-story-state',String(next));
    steps.forEach(function(step,i){var status=i<next?'done':i===next?'active':'future';step.setAttribute('data-bg-story-status',status);if(i===next)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});
    overlays.forEach(function(el,i){if(el)el.setAttribute('data-show',i===next?'1':'0');});
  }

  function isRootInViewport(){
    if(!root)return false;
    var rect=root.getBoundingClientRect();
    return rect.bottom>0&&rect.top<window.innerHeight;
  }

  function nearestStepToViewportCenter(){
    if(!steps.length)return state;
    var center=window.innerHeight/2,best=state,bestDistance=Infinity;
    steps.forEach(function(step,i){var r=step.getBoundingClientRect();var stepCenter=r.top+r.height/2;var distance=Math.abs(stepCenter-center);if(distance<bestDistance){bestDistance=distance;best=i;}});
    return best;
  }

  function measure(){
    ticking=false;
    var active=isRootInViewport();
    document.documentElement.setAttribute('data-bg-story-active',active?'1':'0');
    if(active)setStoryState(nearestStepToViewportCenter());
  }
  function schedule(){if(ticking)return;ticking=true;requestAnimationFrame(measure);}

  function init(){
    if(document.documentElement.dataset.bgScrollStoryReady==='1')return;
    var first=exact(LABELS[0]),second=exact(LABELS[1]),third=exact(LABELS[2]);
    if(!first||!second||!third)return;
    var ctas=Array.prototype.slice.call(document.querySelectorAll('a,button'));
    var cta=ctas.find(function(el){return txt(el).indexOf('Analyseer impact')!==-1;})||null;
    root=findRoot(first,third,cta);if(!root)return;root.setAttribute('data-bg-story-root','');
    var labels=[first,second,third,findFourth(root)].filter(Boolean);
    steps=labels.map(function(el,i){var b=blockFor(el,i<3?LABELS[i]:txt(el));b.setAttribute('data-bg-story-step',String(i));b.setAttribute('tabindex','0');b.addEventListener('click',function(){setStoryState(i);});b.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();setStoryState(i);}});return b;});
    visual=chooseVisual(cta);if(!visual)return;visual.setAttribute('data-bg-story-visual','');
    if(cta)cta.addEventListener('click',function(e){e.preventDefault();setStoryState(1);});
    var signal=smallestContaining(root,'AFAS')||smallestContaining(root,'Microsoft 365');if(signal)signal.setAttribute('data-bg-story-signal','');
    markCostWidget();createOverlays();setStoryState(0);document.documentElement.dataset.bgScrollStoryReady='1';
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});schedule();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
</script>`;

  return source.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
}

const html = await readFile(HOME, 'utf8');
const next = applyHomepageScrollStory(html);
await writeFile(HOME, next, 'utf8');
console.log('Homepage scroll story wired on final built output');
