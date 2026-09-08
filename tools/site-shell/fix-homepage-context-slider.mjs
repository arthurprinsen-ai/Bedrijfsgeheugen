const MARKER = 'data-bg-context-slider-readable';
const SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';

const STYLE = `<style ${MARKER}>
[data-bg-compare-slider]{--split:50%;--bg-compare-split:50%;position:relative!important;overflow:hidden!important;touch-action:pan-y}
[data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important}
[data-bg-compare-slider] .compare-before{clip-path:inset(0 calc(100% - var(--bg-compare-split,50%)) 0 0)!important}
[data-bg-compare-slider] .compare-after{clip-path:inset(0 0 0 var(--bg-compare-split,50%))!important}
[data-bg-compare-slider] .compare-before .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:0!important;margin-right:auto!important;padding-right:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-after .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:auto!important;margin-right:0!important;padding-left:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-handle{display:block!important;position:absolute!important;left:clamp(24px,var(--bg-compare-split,50%),calc(100% - 24px))!important;z-index:20!important}
[data-bg-compare-slider] .compare-knob{pointer-events:auto!important}
[data-bg-change-check-source="true"]{opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important}
.bg-change-check-fallback{display:none}
@media(max-width:720px){
  [data-bg-compare-slider]{min-height:360px!important;overflow:hidden!important}
  [data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;transform:none!important}
  [data-bg-compare-slider] .compare-copy{width:calc(100% - 36px)!important;max-width:none!important;overflow:visible!important;transform:none!important}
  [data-bg-compare-slider] .compare-copy h2,[data-bg-compare-slider] .compare-copy h3,[data-bg-compare-slider] .compare-copy p,[data-bg-compare-slider] .compare-copy li{max-width:none!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:auto}
  [data-bg-compare-slider] .compare-handle{display:block!important}
  [data-bg-change-step]{position:relative!important}
  .bg-change-check-fallback{position:absolute;left:18px;bottom:42px;width:42px;height:42px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#e4f8ed;color:#087a4b;font:900 25px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:3;box-sizing:border-box}
}
</style>`;

const RUNTIME = `<script ${MARKER}>
(function(){
  var SLIDER_SELECTOR = ${JSON.stringify(SLIDER_SELECTOR)};
  var SNAP_THRESHOLD = 8;
  var CHANGE_TITLE='Eén wijziging. Overal doorgewerkt.';
  var CHANGE_STEPS=['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'];

  function norm(v){return String(v||'').replace(/\\s+/g,' ').trim();}
  function allHeadings(root){return [].slice.call(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'));}
  function findHeading(root,label){return allHeadings(root).find(function(h){return norm(h.textContent)===label;})||null;}
  function changeStepContainer(kop,section){
    var node=kop;
    while(node.parentElement&&node.parentElement!==section){
      var parent=node.parentElement;
      var count=allHeadings(parent).filter(function(h){return CHANGE_STEPS.indexOf(norm(h.textContent))!==-1;}).length;
      if(count!==1)break;
      node=parent;
    }
    return node;
  }
  function rgb(value){
    var m=String(value||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)/i);
    return m?[+m[1],+m[2],+m[3]]:null;
  }
  function green(value){
    var c=rgb(value);if(!c)return false;
    return (c[1]>c[0]+24&&c[1]>c[2]+10)||(c[1]>95&&c[0]<80&&c[2]<120);
  }
  function explicitCheck(el){
    var sig=[el.className&&el.className.baseVal||el.className,el.id,el.getAttribute&&el.getAttribute('src'),el.getAttribute&&el.getAttribute('aria-label'),el.getAttribute&&el.getAttribute('title')].join(' ').toLowerCase();
    return /(check|tick|vink|complete|completed|done|success|status-ok)/.test(sig)||norm(el.textContent)==='✓';
  }
  function visualCheck(el){
    var r=el.getBoundingClientRect();
    if(r.width<18||r.width>64||r.height<18||r.height>64)return false;
    var s=getComputedStyle(el),p=el.parentElement?getComputedStyle(el.parentElement):null;
    return green(s.color)||green(s.backgroundColor)||(p&&(green(p.color)||green(p.backgroundColor)));
  }
  function findCheck(row){
    var nodes=[].slice.call(row.querySelectorAll('img,svg,span,i,div'));
    return nodes.find(explicitCheck)||nodes.find(visualCheck)||null;
  }
  function ensureFallback(row){
    if(row.querySelector('.bg-change-check-fallback'))return;
    var el=document.createElement('span');
    el.className='bg-change-check-fallback';
    el.setAttribute('aria-hidden','true');
    el.textContent='✓';
    row.appendChild(el);
  }
  function ensureFourChangeChecks(){
    var title=findHeading(document,CHANGE_TITLE);if(!title)return;
    var section=title.closest('section')||title.parentElement;if(!section)return;
    var rows=CHANGE_STEPS.map(function(label){var h=findHeading(section,label);return h?changeStepContainer(h,section):null;});
    if(rows.some(function(row){return !row;}))return;
    rows.forEach(function(row,index){
      if(row.getAttribute('data-bg-change-step')!==String(index+1))row.setAttribute('data-bg-change-step',String(index+1));
      var check=findCheck(row);
      if(check){
        if(check.getAttribute('data-bg-change-check-source')!=='true')check.setAttribute('data-bg-change-check-source','true');
        var old=row.querySelector('.bg-change-check-fallback');if(old)old.remove();
      }else ensureFallback(row);
    });
  }

  function collectSliders(){
    var set=new Set([].slice.call(document.querySelectorAll(SLIDER_SELECTOR)));
    [].slice.call(document.querySelectorAll('.compare-before')).forEach(function(before){
      var parent=before.parentElement;
      if(parent&&parent.querySelector('.compare-after'))set.add(parent);
    });
    return [].slice.call(set).filter(function(slider){return slider.querySelector('.compare-before')&&slider.querySelector('.compare-after');});
  }

  function initSlider(slider){
    if(slider.getAttribute('data-bg-compare-ready')==='true')return;
    slider.setAttribute('data-bg-compare-slider','');
    slider.setAttribute('data-bg-compare-ready','true');
    var beforeSide=slider.querySelector('.compare-before');
    var afterSide=slider.querySelector('.compare-after');
    var handle=slider.querySelector('.compare-handle');
    var knob=slider.querySelector('.compare-knob');
    var dragging=false;
    var touchDragging=false;

    function snap(raw){
      var value=Math.max(0,Math.min(100,Number(raw)||0));
      return value<=SNAP_THRESHOLD?0:value>=100-SNAP_THRESHOLD?100:value;
    }
    function readLegacy(){
      var raw=parseFloat(getComputedStyle(slider).getPropertyValue('--split'));
      return Number.isFinite(raw)?raw:50;
    }
    function readControlled(){
      var raw=parseFloat(getComputedStyle(slider).getPropertyValue('--bg-compare-split'));
      return Number.isFinite(raw)?raw:snap(readLegacy());
    }
    function syncAria(value){
      if(!knob)return;
      value=Number.isFinite(value)?value:readControlled();
      if(knob.getAttribute('aria-valuemin')!=='0')knob.setAttribute('aria-valuemin','0');
      if(knob.getAttribute('aria-valuemax')!=='100')knob.setAttribute('aria-valuemax','100');
      if(knob.getAttribute('aria-valuenow')!==value.toFixed(0))knob.setAttribute('aria-valuenow',value.toFixed(0));
      if(knob.getAttribute('aria-disabled')==='true')knob.setAttribute('aria-disabled','false');
      if(knob.tabIndex<0)knob.tabIndex=0;
    }
    function renderControlled(raw){
      var value=snap(raw);
      var pct=value.toFixed(2)+'%';
      var current=parseFloat(slider.style.getPropertyValue('--bg-compare-split'));
      if(!Number.isFinite(current)||Math.abs(current-value)>.01)slider.style.setProperty('--bg-compare-split',pct);
      var beforeClip='inset(0 '+(100-value).toFixed(2)+'% 0 0)';
      var afterClip='inset(0 0 0 '+value.toFixed(2)+'%)';
      if(beforeSide&&beforeSide.style.getPropertyValue('clip-path')!==beforeClip)beforeSide.style.setProperty('clip-path',beforeClip,'important');
      if(afterSide&&afterSide.style.getPropertyValue('clip-path')!==afterClip)afterSide.style.setProperty('clip-path',afterClip,'important');
      if(handle){
        var left='clamp(24px,'+pct+',calc(100% - 24px))';
        if(handle.style.getPropertyValue('left')!==left)handle.style.setProperty('left',left,'important');
      }
      syncAria(value);
      return value;
    }
    function mirrorLegacy(){renderControlled(readLegacy());}
    function syncLoop(){mirrorLegacy();requestAnimationFrame(syncLoop);}
    function apply(raw){
      var value=snap(raw);
      slider.style.setProperty('--split',value.toFixed(2)+'%');
      return renderControlled(value);
    }
    function applyFromClientX(clientX){
      var r=slider.getBoundingClientRect();
      if(!r.width)return apply(50);
      return apply(((clientX-r.left)/r.width)*100);
    }
    function settleFromClientX(clientX){
      applyFromClientX(clientX);
      requestAnimationFrame(function(){
        applyFromClientX(clientX);
        requestAnimationFrame(function(){applyFromClientX(clientX);});
      });
    }
    function current(){return readControlled();}

    new MutationObserver(mirrorLegacy).observe(slider,{attributes:true,attributeFilter:['style']});
    if(knob)new MutationObserver(function(){syncAria();}).observe(knob,{attributes:true,attributeFilter:['aria-valuenow','aria-valuemin','aria-valuemax','aria-disabled','tabindex']});

    slider.addEventListener('pointerdown',function(e){
      dragging=true;
      if(knob&&e.target===knob)knob.setPointerCapture?.(e.pointerId);
      settleFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    window.addEventListener('pointermove',function(e){
      if(!dragging)return;
      settleFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    window.addEventListener('pointerup',function(e){
      if(!dragging)return;
      dragging=false;
      settleFromClientX(e.clientX);
      e.stopImmediatePropagation();
    },true);
    window.addEventListener('pointercancel',function(){dragging=false;},true);

    slider.addEventListener('touchstart',function(e){
      if(!e.touches||!e.touches[0])return;
      touchDragging=true;
      settleFromClientX(e.touches[0].clientX);
    },{capture:true,passive:true});
    window.addEventListener('touchmove',function(e){
      if(!touchDragging||!e.touches||!e.touches[0])return;
      settleFromClientX(e.touches[0].clientX);
    },{capture:true,passive:true});
    window.addEventListener('touchend',function(e){
      if(!touchDragging)return;
      touchDragging=false;
      var point=e.changedTouches&&e.changedTouches[0];
      if(point)settleFromClientX(point.clientX);
    },{capture:true,passive:true});
    window.addEventListener('touchcancel',function(){touchDragging=false;},{capture:true,passive:true});

    if(knob){
      knob.addEventListener('keydown',function(e){
        var value=current();
        if(e.key==='ArrowLeft')value-=5;
        else if(e.key==='ArrowRight')value+=5;
        else if(e.key==='Home')value=0;
        else if(e.key==='End')value=100;
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        apply(value);
      },true);
    }

    mirrorLegacy();
    requestAnimationFrame(syncLoop);
  }

  function ensureSliders(){collectSliders().forEach(initSlider);}

  ensureFourChangeChecks();
  ensureSliders();
  new MutationObserver(function(){ensureFourChangeChecks();ensureSliders();}).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',function(){ensureFourChangeChecks();ensureSliders();},{passive:true});
})();
</script>`;

function normalizeLegacyBounds(html){
  return html
    .replace(/Math\.max\((?:8|6|30|40),\s*Math\.min\((?:92|94|70|60),/g, 'Math.max(0,Math.min(100,')
    .replace(/aria-valuemin=(['"])(?:6|8|30|40)\1/g, 'aria-valuemin="0"')
    .replace(/aria-valuemax=(['"])(?:94|92|70|60)\1/g, 'aria-valuemax="100"');
}

function stripExistingGuard(html){
  return html
    .replace(/<style\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function applyHomepageContextSliderReadability(html){
  let next=stripExistingGuard(normalizeLegacyBounds(html));
  next=next.replace('</head>',`${STYLE}\n</head>`);
  next=next.replace('</body>',`${RUNTIME}\n</body>`);
  if(!next.includes('SLIDER_SELECTOR')||
     !next.includes('#compareSlider,.compare-slider,[data-compare-slider]')||
     !next.includes('data-bg-compare-slider')||
     !next.includes('--bg-compare-split')||
     !next.includes('SNAP_THRESHOLD = 8')||
     !next.includes('mirrorLegacy')||
     !next.includes('syncLoop')||
     !next.includes("setProperty('clip-path'")||
     !next.includes('settleFromClientX')||
     !next.includes('requestAnimationFrame')||
     !next.includes("aria-valuemin','0")||
     !next.includes("aria-valuemax','100")||
     !next.includes('Math.max(0,Math.min(100')||
     !next.includes('touchstart')||
     !next.includes('touchmove')||
     !next.includes('touchend')||
     !next.includes('ensureFourChangeChecks')||
     !next.includes('Opvolging ontstaat')||
     !next.includes('Waarde wordt gemeten')||
     !next.includes('bg-change-check-fallback')||
     (next.match(/<style data-bg-context-slider-readable>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-readable>/g)||[]).length!==1){
    throw new Error('Compare-slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}
