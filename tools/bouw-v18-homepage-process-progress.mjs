import { readFile, writeFile } from 'node:fs/promises';

const MARKER = 'bg-home-process-progress-v1';
const TARGET_HEADING = 'Zo blijft je bedrijfsgeheugen actueel.';

export function reachedFromGeometry(fillEnd, stepStarts) {
  const end = Number(fillEnd);
  return stepStarts.map((start, index) => index === 0 || end + 2 >= Number(start));
}

export function injectHomepageProcessProgress(html) {
  if (!html.includes(TARGET_HEADING) || html.includes(`id="${MARKER}"`)) return html;

  const patch = `<style id="${MARKER}">
[data-bg-process-step][data-bg-process-reached="true"]{opacity:1!important;filter:none!important}
[data-bg-process-step][data-bg-process-reached="true"] h3,
[data-bg-process-step][data-bg-process-reached="true"] p{opacity:1!important;filter:none!important}
[data-bg-process-step][data-bg-process-reached="true"] h3{color:#14171A!important}
[data-bg-process-step][data-bg-process-reached="true"] p{color:#566879!important}
</style>
<script id="${MARKER}-js">
(function(){
  var TITEL='${TARGET_HEADING}';
  var STAPPEN=['Zie waar waarde lekt','Koppel de eerste bronnen','Laat context werken','Automatiseer opvolging'];
  function norm(v){return String(v||'').replace(/\\s+/g,' ').trim();}
  function blauw(kleur){
    var m=String(kleur||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)/i);
    if(!m)return false;
    var r=+m[1],g=+m[2],b=+m[3];
    return b>r+55&&b>g+45;
  }
  function vindKop(){
    return [].slice.call(document.querySelectorAll('h1,h2,h3')).find(function(h){return norm(h.textContent)===TITEL;})||null;
  }
  function stapKop(sectie,naam){
    return [].slice.call(sectie.querySelectorAll('h2,h3,h4')).find(function(h){return norm(h.textContent)===naam;})||null;
  }
  function stapContainer(kop,sectie){
    var huidig=kop;
    while(huidig.parentElement&&huidig.parentElement!==sectie){
      var ouder=huidig.parentElement;
      var aantal=[].slice.call(ouder.querySelectorAll('h2,h3,h4')).filter(function(h){return STAPPEN.indexOf(norm(h.textContent))!==-1;}).length;
      if(aantal!==1)break;
      huidig=ouder;
    }
    return huidig;
  }
  function pseudoRatio(el,trackBreedte,soort){
    try{
      var s=getComputedStyle(el,soort);
      if(!s||s.content==='none'||s.display==='none')return null;
      var w=parseFloat(s.width);
      if(!isFinite(w)||w<1||w>trackBreedte+3)return null;
      if(!blauw(s.backgroundColor)&&!blauw(s.borderTopColor))return null;
      return Math.max(0,Math.min(1,w/Math.max(1,trackBreedte)));
    }catch(e){return null;}
  }
  function meetLijn(sectie,stapEls,kop){
    var sr=sectie.getBoundingClientRect();
    var eersteTop=Math.min.apply(null,stapEls.map(function(el){return el.getBoundingClientRect().top;}));
    var kopBottom=kop.getBoundingClientRect().bottom;
    var kandidaten=[];
    [].slice.call(sectie.querySelectorAll('*')).forEach(function(el){
      var r=el.getBoundingClientRect();
      if(r.width<24||r.height<1||r.height>14)return;
      if(r.top<kopBottom-8||r.top>eersteTop+24)return;
      kandidaten.push({el:el,r:r,style:getComputedStyle(el)});
    });
    if(!kandidaten.length)return null;
    var tracks=kandidaten.filter(function(x){return x.r.width>=sr.width*.55;}).sort(function(a,b){return b.r.width-a.r.width;});
    if(!tracks.length)return null;
    var track=tracks[0],tw=track.r.width;
    var ratios=[];
    [':before',':after','::before','::after'].forEach(function(p){var q=pseudoRatio(track.el,tw,p);if(q!==null)ratios.push(q);});
    kandidaten.forEach(function(x){
      if(x.el===track.el)return;
      if(Math.abs(x.r.left-track.r.left)>8||x.r.width>tw+3)return;
      if(blauw(x.style.backgroundColor)||blauw(x.style.borderTopColor))ratios.push(Math.max(0,Math.min(1,x.r.width/tw)));
    });
    [].slice.call(track.el.children||[]).forEach(function(el){
      var r=el.getBoundingClientRect(),s=getComputedStyle(el);
      if(Math.abs(r.left-track.r.left)<=8&&r.width<=tw+3&&(blauw(s.backgroundColor)||blauw(s.borderTopColor)))ratios.push(Math.max(0,Math.min(1,r.width/tw)));
    });
    if(!ratios.length)return null;
    var ratio=Math.max.apply(null,ratios);
    return {start:track.r.left,end:track.r.left+tw*ratio,ratio:ratio};
  }
  function init(){
    var kop=vindKop();
    if(!kop)return;
    var sectie=kop.closest('section')||kop.parentElement;
    if(!sectie)return;
    var stapEls=STAPPEN.map(function(n){var h=stapKop(sectie,n);return h?stapContainer(h,sectie):null;});
    if(stapEls.some(function(x){return !x;}))return;
    stapEls.forEach(function(el,i){el.setAttribute('data-bg-process-step',String(i+1));});
    var actief=false,raf=0;
    function teken(){
      raf=0;
      if(!actief)return;
      var lijn=meetLijn(sectie,stapEls,kop);
      if(lijn){
        var starts=stapEls.map(function(el){return el.getBoundingClientRect().left;});
        stapEls.forEach(function(el,i){
          var bereikt=i===0||lijn.end+2>=starts[i];
          el.setAttribute('data-bg-process-reached',bereikt?'true':'false');
        });
      }else{
        stapEls[0].setAttribute('data-bg-process-reached','true');
      }
      raf=requestAnimationFrame(teken);
    }
    function start(){if(actief)return;actief=true;if(!raf)raf=requestAnimationFrame(teken);}
    function stop(){actief=false;if(raf){cancelAnimationFrame(raf);raf=0;}}
    if('IntersectionObserver'in window){
      new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)start();else stop();});},{rootMargin:'120px 0px'}).observe(sectie);
    }else start();
    addEventListener('resize',function(){if(actief&&!raf)raf=requestAnimationFrame(teken);});
    start();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
</script>`;

  return html.replace('</body>', `${patch}\n</body>`);
}

export async function applyHomepageProcessProgress(root = '.') {
  const path = `${root.replace(/\/$/, '')}/index.html`;
  const html = await readFile(path, 'utf8');
  const next = injectHomepageProcessProgress(html);
  if (next !== html) await writeFile(path, next, 'utf8');
  return next !== html;
}
