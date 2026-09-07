import { readFile, writeFile } from 'node:fs/promises';

const HOME = 'index.html';
const STYLE_ID = 'homepage-scroll-story-style';
const SCRIPT_ID = 'homepage-scroll-story-script';
const ROOT_ATTR = 'data-bg-story-root';
const REQUIRED = [
  'Signaal komt binnen',
  'Context wordt begrepen',
  'Opvolging ontstaat',
  'Analyseer impact',
];

function matchingSectionEnd(source, start) {
  const token = /<\/?section\b[^>]*>/gi;
  token.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = token.exec(source))) {
    if (/^<\/section/i.test(match[0])) {
      depth--;
      if (depth === 0) return token.lastIndex;
    } else {
      depth++;
    }
  }
  return -1;
}

export function markStorySection(html) {
  const source = String(html || '');
  const positions = REQUIRED.map(marker => source.indexOf(marker));
  if (positions.some(position => position < 0)) {
    const missing = REQUIRED.filter((_, index) => positions[index] < 0);
    throw new Error(`Homepage scroll story: vereiste marker(s) ontbreken: ${missing.join(', ')}`);
  }

  const first = Math.min(...positions);
  const last = Math.max(...positions);
  let cursor = first;
  while (cursor >= 0) {
    const start = source.lastIndexOf('<section', cursor);
    if (start < 0) break;
    const end = matchingSectionEnd(source, start);
    if (end > last) {
      const openEnd = source.indexOf('>', start);
      if (openEnd < 0 || openEnd > end) break;
      const opening = source.slice(start, openEnd + 1);
      if (opening.includes(ROOT_ATTR)) return source;
      const marked = opening.replace(/>$/, ` ${ROOT_ATTR}>`);
      return source.slice(0, start) + marked + source.slice(openEnd + 1);
    }
    cursor = start - 1;
  }
  throw new Error('Homepage scroll story: geen gedeelde section-root gevonden voor de vier vaste markers');
}

export function applyHomepageScrollStory(html) {
  let source = String(html || '');
  if (source.includes(`id="${SCRIPT_ID}"`)) return source;
  if (!source.includes('</head>') || !source.includes('</body>')) {
    throw new Error('Homepage scroll story: ongeldige HTML-shell');
  }

  source = markStorySection(source);

  const css = `<style id="${STYLE_ID}">
[${ROOT_ATTR}]{
  min-height:0!important;
  height:auto!important;
  position:relative!important;
  top:auto!important;
  bottom:auto!important;
  overflow:visible!important;
  padding-bottom:clamp(48px,6vw,96px)!important;
  isolation:isolate;
}
[${ROOT_ATTR}]>*{
  min-height:0!important;
  height:auto!important;
  max-height:none!important;
  position:relative!important;
  top:auto!important;
  bottom:auto!important;
}
[${ROOT_ATTR}] [data-bg-story-stage]{
  position:relative!important;
  top:auto!important;
  bottom:auto!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
}
[${ROOT_ATTR}] [data-bg-story-step]{transition:opacity .18s ease,color .18s ease,transform .18s ease}
[${ROOT_ATTR}] [data-bg-story-step][data-bg-story-status="future"]{opacity:.58!important}
[${ROOT_ATTR}] [data-bg-story-step][data-bg-story-status="active"]{opacity:1!important;transform:translateX(3px)}
[${ROOT_ATTR}] [data-bg-story-step][data-bg-story-status="done"]{opacity:.78!important}
[${ROOT_ATTR}] [data-bg-story-step][aria-current="step"]{color:inherit!important}
html[data-bg-story-active="1"] [data-bg-story-cost]{opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(12px)!important;transition:opacity .15s ease,transform .15s ease!important}
@media(max-width:1023px){
  [${ROOT_ATTR}]{padding-bottom:48px!important}
  [${ROOT_ATTR}] [data-bg-story-step]{opacity:1!important;transform:none!important}
}
@media(prefers-reduced-motion:reduce){
  [${ROOT_ATTR}] [data-bg-story-step],[data-bg-story-cost]{transition:none!important;transform:none!important}
}
</style>`;

  const js = `<script id="${SCRIPT_ID}">
(function(){
  'use strict';
  var LABELS=['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat'];
  var FOURTH=['Effect wordt zichtbaar','Effect wordt gevolgd','Effect wordt gemeten','Impact wordt zichtbaar','Waarde wordt gemeten'];
  var root=null,steps=[];

  function text(el){return (el&&el.textContent||'').replace(/\\s+/g,' ').trim();}
  function exact(scope,label){return Array.prototype.find.call(scope.querySelectorAll('h1,h2,h3,h4,h5,h6,b,strong,span,p,div,li'),function(el){return text(el)===label;})||null;}
  function costWidget(){
    var candidates=Array.prototype.slice.call(document.querySelectorAll('div,aside,a'));
    var hits=candidates.filter(function(el){var t=text(el);return t.indexOf('Sinds deze pagina opende')!==-1&&t.indexOf('Reken het na')!==-1;});
    hits.sort(function(a,b){return text(a).length-text(b).length;});
    return hits[0]||null;
  }
  function fourth(){for(var i=0;i<FOURTH.length;i++){var hit=exact(root,FOURTH[i]);if(hit)return hit;}return null;}
  function setState(index){
    index=Math.max(0,Math.min(steps.length-1,Number(index)||0));
    root.setAttribute('data-bg-story-state',String(index));
    steps.forEach(function(step,i){
      step.setAttribute('data-bg-story-status',i<index?'done':i===index?'active':'future');
      if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
    });
  }
  function init(){
    if(document.documentElement.dataset.bgScrollStoryReady==='1')return;
    root=document.querySelector('[${ROOT_ATTR}]');
    if(!root)return;
    var labels=LABELS.map(function(label){return exact(root,label);});
    labels.push(fourth());
    steps=labels.filter(Boolean);
    if(steps.length<3)return;
    steps.forEach(function(step,i){
      step.setAttribute('data-bg-story-step',String(i));
      step.setAttribute('tabindex','0');
      step.addEventListener('click',function(){setState(i);});
      step.addEventListener('keydown',function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();setState(i);}});
    });
    var cost=costWidget();if(cost)cost.setAttribute('data-bg-story-cost','');
    setState(0);

    var rootObserver=new IntersectionObserver(function(entries){
      var visible=entries.some(function(entry){return entry.isIntersecting&&entry.intersectionRatio>.08;});
      document.documentElement.setAttribute('data-bg-story-active',visible?'1':'0');
    },{threshold:[0,.08,.2]});
    rootObserver.observe(root);

    var stepObserver=new IntersectionObserver(function(entries){
      var best=null;
      entries.forEach(function(entry){if(entry.isIntersecting&&(!best||entry.intersectionRatio>best.intersectionRatio))best=entry;});
      if(best){var i=steps.indexOf(best.target);if(i>=0)setState(i);}
    },{root:null,rootMargin:'-28% 0px -28% 0px',threshold:[.15,.35,.6]});
    steps.forEach(function(step){stepObserver.observe(step);});
    document.documentElement.dataset.bgScrollStoryReady='1';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
</script>`;

  return source.replace('</head>', `${css}\n</head>`).replace('</body>', `${js}\n</body>`);
}

const html = await readFile(HOME, 'utf8');
const next = applyHomepageScrollStory(html);
await writeFile(HOME, next, 'utf8');
console.log('Homepage story projected with one explicit build-time layout owner');
