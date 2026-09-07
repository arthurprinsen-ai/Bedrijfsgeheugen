const MARKER = 'data-bg-context-slider-readable';
const MIN_DESKTOP_PANE_PX = 320;
const MIN_COMPACT_PANE_PX = 240;
const HANDLE_GUTTER_PX = 64;
const MOBILE_BREAKPOINT_PX = 720;

const STYLE = `<style ${MARKER}>
#compareSlider{--bg-compare-gutter:${HANDLE_GUTTER_PX}px;touch-action:pan-y}
#compareSlider .compare-before .compare-copy{width:min(460px,calc(var(--split,50%) - 108px));max-width:none;padding-right:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-after .compare-copy{width:min(460px,calc(100% - var(--split,50%) - 108px));max-width:none;margin-left:auto;padding-left:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-handle{z-index:8}
#compareSlider[data-bg-compare-compact="true"]{height:auto!important;overflow:visible!important;display:grid!important;grid-template-columns:1fr!important;gap:14px!important;background:transparent!important;box-shadow:none!important}
#compareSlider[data-bg-compare-compact="true"] .compare-side{position:relative!important;inset:auto!important;clip-path:none!important;width:100%!important;padding:24px!important;border-radius:24px!important;min-height:0!important}
#compareSlider[data-bg-compare-compact="true"] .compare-copy{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}
#compareSlider[data-bg-compare-compact="true"] .compare-handle{display:none!important}
[data-bg-change-check-source="true"]{opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important}
.bg-change-check-fallback{display:none}
@media(max-width:${MOBILE_BREAKPOINT_PX}px){
  #compareSlider{height:auto!important;overflow:visible!important;display:grid!important;grid-template-columns:1fr!important;gap:14px!important;background:transparent!important;box-shadow:none!important;--split:50%!important}
  #compareSlider .compare-side{position:relative!important;inset:auto!important;clip-path:none!important;width:100%!important;max-width:none!important;padding:22px!important;border-radius:22px!important;min-height:0!important;transform:none!important}
  #compareSlider .compare-copy{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important;transform:none!important}
  #compareSlider .compare-copy h2,#compareSlider .compare-copy h3,#compareSlider .compare-copy p,#compareSlider .compare-copy li{max-width:none!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:auto}
  #compareSlider .compare-handle{display:none!important}
  [data-bg-change-step]{position:relative!important}
  .bg-change-check-fallback{position:absolute;left:18px;bottom:42px;width:42px;height:42px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:#e4f8ed;color:#087a4b;font:900 25px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:3;box-sizing:border-box}
}
</style>`;

const RUNTIME = `<script ${MARKER}>
(function(){
  var MIN_DESKTOP_PANE_PX = ${MIN_DESKTOP_PANE_PX};
  var MIN_COMPACT_PANE_PX = ${MIN_COMPACT_PANE_PX};
  var HANDLE_GUTTER_PX = ${HANDLE_GUTTER_PX};
  var MOBILE_BREAKPOINT_PX = ${MOBILE_BREAKPOINT_PX};
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
    var nodes=[].slice.call(row.querySelectorAll('img,svg,span,i,div')).filter(function(el){return !el.classList.contains('bg-change-check-fallback');});
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
      row.setAttribute('data-bg-change-step',String(index+1));
      var check=findCheck(row);
      if(check){
        check.setAttribute('data-bg-change-check-source','true');
        var old=row.querySelector('.bg-change-check-fallback');if(old)old.remove();
      }else ensureFallback(row);
    });
  }

  ensureFourChangeChecks();
  new MutationObserver(ensureFourChangeChecks).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','hidden']});
  window.addEventListener('resize',ensureFourChangeChecks,{passive:true});

  var slider = document.getElementById('compareSlider');
  if(!slider) return;
  var knob = slider.querySelector('.compare-knob');
  var dragging = false;

  function getLimits(){
    var r = slider.getBoundingClientRect();
    var forceMobileCompact = window.matchMedia('(max-width: 720px)').matches;
    var compactThreshold = (MIN_COMPACT_PANE_PX * 2) + (HANDLE_GUTTER_PX * 2) + 88;
    var compact = forceMobileCompact || r.width < compactThreshold;
    slider.setAttribute('data-bg-compare-compact', compact ? 'true' : 'false');
    if(compact) return {min:50,max:50,compact:true};
    var safePanePx = MIN_DESKTOP_PANE_PX + HANDLE_GUTTER_PX + 44;
    var minPct = Math.min(45, safePanePx / Math.max(1,r.width) * 100);
    return {min:minPct,max:100-minPct,compact:false};
  }

  function apply(raw){
    var limits = getLimits();
    var value = limits.compact ? 50 : Math.max(limits.min, Math.min(limits.max, raw));
    slider.style.setProperty('--split', value.toFixed(2) + '%');
    if(knob){
      knob.setAttribute('aria-valuemin', limits.min.toFixed(0));
      knob.setAttribute('aria-valuemax', limits.max.toFixed(0));
      knob.setAttribute('aria-valuenow', value.toFixed(0));
      knob.setAttribute('aria-disabled', limits.compact ? 'true' : 'false');
      knob.tabIndex = limits.compact ? -1 : 0;
    }
    return value;
  }

  function applyFromClientX(clientX){
    var r = slider.getBoundingClientRect();
    if(!r.width) return apply(50);
    return apply(((clientX-r.left)/r.width)*100);
  }

  function current(){
    var raw = parseFloat(getComputedStyle(slider).getPropertyValue('--split'));
    return Number.isFinite(raw) ? raw : 50;
  }

  function normalize(){ apply(current()); }

  slider.addEventListener('pointerdown',function(e){
    var limits = getLimits();
    if(limits.compact) return;
    dragging = true;
    if(knob && e.target===knob) knob.setPointerCapture?.(e.pointerId);
    applyFromClientX(e.clientX);
    e.preventDefault();
    e.stopPropagation();
  },true);

  window.addEventListener('pointermove',function(e){
    if(!dragging) return;
    applyFromClientX(e.clientX);
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  window.addEventListener('pointerup',function(e){
    if(!dragging) return;
    dragging=false;
    applyFromClientX(e.clientX);
  },true);

  window.addEventListener('pointercancel',function(){ dragging=false; },true);

  if(knob){
    knob.addEventListener('keydown',function(e){
      var limits=getLimits();
      if(limits.compact) return;
      var value=current();
      if(e.key==='ArrowLeft') value-=3;
      else if(e.key==='ArrowRight') value+=3;
      else if(e.key==='Home') value=limits.min;
      else if(e.key==='End') value=limits.max;
      else return;
      e.preventDefault();
      e.stopImmediatePropagation();
      apply(value);
    },true);
  }

  window.addEventListener('resize',normalize,{passive:true});
  if(window.visualViewport) window.visualViewport.addEventListener('resize',normalize,{passive:true});
  normalize();
})();
</script>`;

function normalizeLegacyBounds(html){
  return html
    .replace(/Math\.max\(8,\s*Math\.min\(92,/g, 'Math.max(40,Math.min(60,')
    .replace(/Math\.max\(6,\s*Math\.min\(94,/g, 'Math.max(40,Math.min(60,')
    .replace(/Math\.max\(30,\s*Math\.min\(70,/g, 'Math.max(40,Math.min(60,')
    .replace(/aria-valuemin=(['"])(?:0|6|8|30)\1/g, 'aria-valuemin="40"')
    .replace(/aria-valuemax=(['"])(?:100|94|92|70)\1/g, 'aria-valuemax="60"');
}

function stripExistingGuard(html){
  return html
    .replace(/<style\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function applyHomepageContextSliderReadability(html){
  if(!/id=(['"])compareSlider\1/.test(html)) return html;
  let next = stripExistingGuard(normalizeLegacyBounds(html));
  next = next.replace('</head>', `${STYLE}\n</head>`);
  next = next.replace('</body>', `${RUNTIME}\n</body>`);
  if(!next.includes('.compare-before .compare-copy') ||
     !next.includes('.compare-after .compare-copy') ||
     !next.includes('MIN_DESKTOP_PANE_PX = 320') ||
     !next.includes('MIN_COMPACT_PANE_PX = 240') ||
     !next.includes('HANDLE_GUTTER_PX = 64') ||
     !next.includes('MOBILE_BREAKPOINT_PX = 720') ||
     !next.includes('@media(max-width:720px)') ||
     !next.includes("window.matchMedia('(max-width: 720px)').matches") ||
     !next.includes('ensureFourChangeChecks') ||
     !next.includes('Opvolging ontstaat') ||
     !next.includes('Waarde wordt gemeten') ||
     !next.includes('bg-change-check-fallback') ||
     !next.includes('applyFromClientX') ||
     !next.includes('data-bg-compare-compact') ||
     (next.match(/<style data-bg-context-slider-readable>/g) || []).length !== 1 ||
     (next.match(/<script data-bg-context-slider-readable>/g) || []).length !== 1) {
    throw new Error('Homepage context slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}
