const MARKER = 'data-bg-context-slider-readable';
const MIN_DESKTOP_PANE_PX = 320;
const MIN_MOBILE_PANE_PX = 132;
const HANDLE_GUTTER_PX = 40;
const MOBILE_BREAKPOINT_PX = 720;

const STYLE = `<style ${MARKER}>
#compareSlider{--bg-compare-gutter:${HANDLE_GUTTER_PX}px;touch-action:none;overscroll-behavior-x:contain}
#compareSlider .compare-before .compare-copy{width:min(460px,calc(var(--split,50%) - 84px));max-width:none;padding-right:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-after .compare-copy{width:min(460px,calc(100% - var(--split,50%) - 84px));max-width:none;margin-left:auto;padding-left:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-handle{z-index:8;display:block!important;touch-action:none}
#compareSlider .compare-knob{touch-action:none;-webkit-user-select:none;user-select:none}
@media(max-width:${MOBILE_BREAKPOINT_PX - 1}px){
  #compareSlider{position:relative!important;min-height:430px;height:min(68vh,520px)!important;overflow:hidden!important;border-radius:28px!important}
  #compareSlider .compare-side{position:absolute!important;inset:0!important;min-height:100%!important}
  #compareSlider .compare-copy{max-width:none!important;box-sizing:border-box!important}
  #compareSlider .compare-before .compare-copy{width:calc(var(--split,50%) - 32px)!important;padding-right:18px!important}
  #compareSlider .compare-after .compare-copy{width:calc(100% - var(--split,50%) - 32px)!important;padding-left:18px!important}
  #compareSlider .compare-handle{display:block!important;z-index:12!important}
  #compareSlider .compare-knob{display:flex!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}
}
</style>`;

const RUNTIME = `<script ${MARKER}>
(function(){
  var MIN_DESKTOP_PANE_PX = ${MIN_DESKTOP_PANE_PX};
  var MIN_MOBILE_PANE_PX = ${MIN_MOBILE_PANE_PX};
  var HANDLE_GUTTER_PX = ${HANDLE_GUTTER_PX};
  var MOBILE_BREAKPOINT_PX = ${MOBILE_BREAKPOINT_PX};
  var slider = document.getElementById('compareSlider');
  if(!slider) return;
  var knob = slider.querySelector('.compare-knob');
  var dragging = false;
  var activePointerId = null;

  function getLimits(){
    var r = slider.getBoundingClientRect();
    var mobile = r.width < MOBILE_BREAKPOINT_PX;
    if(mobile){
      var minPctMobile = Math.max(26, Math.min(38, (MIN_MOBILE_PANE_PX / Math.max(1,r.width)) * 100));
      return {min:minPctMobile,max:100-minPctMobile,mobile:true};
    }
    var safePanePx = MIN_DESKTOP_PANE_PX + HANDLE_GUTTER_PX + 44;
    var minPct = Math.min(45, safePanePx / Math.max(1,r.width) * 100);
    return {min:minPct,max:100-minPct,mobile:false};
  }

  function apply(raw){
    var limits = getLimits();
    var value = Math.max(limits.min, Math.min(limits.max, raw));
    slider.style.setProperty('--split', value.toFixed(2) + '%');
    if(knob){
      knob.setAttribute('aria-valuemin', limits.min.toFixed(0));
      knob.setAttribute('aria-valuemax', limits.max.toFixed(0));
      knob.setAttribute('aria-valuenow', value.toFixed(0));
      knob.setAttribute('aria-disabled', 'false');
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

  function beginDrag(e){
    dragging = true;
    activePointerId = e.pointerId;
    if(knob && e.target===knob && knob.setPointerCapture){
      try { knob.setPointerCapture(e.pointerId); } catch (_) {}
    }
    applyFromClientX(e.clientX);
    e.preventDefault();
    e.stopPropagation();
  }

  slider.addEventListener('pointerdown', beginDrag, true);

  window.addEventListener('pointermove',function(e){
    if(!dragging) return;
    if(activePointerId !== null && e.pointerId !== activePointerId) return;
    applyFromClientX(e.clientX);
    e.preventDefault();
    e.stopImmediatePropagation();
  },true);

  function endDrag(e){
    if(!dragging) return;
    if(activePointerId !== null && e.pointerId !== activePointerId) return;
    dragging=false;
    activePointerId=null;
    applyFromClientX(e.clientX);
  }

  window.addEventListener('pointerup',endDrag,true);
  window.addEventListener('pointercancel',function(){ dragging=false; activePointerId=null; },true);

  if(knob){
    knob.addEventListener('keydown',function(e){
      var limits=getLimits();
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

  window.addEventListener('resize',function(){ apply(current()); },{passive:true});
  apply(current());
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
     !next.includes('MIN_MOBILE_PANE_PX = 132') ||
     !next.includes('HANDLE_GUTTER_PX = 40') ||
     !next.includes('applyFromClientX') ||
     !next.includes('setPointerCapture') ||
     next.includes('data-bg-compare-compact') ||
     (next.match(/<style data-bg-context-slider-readable>/g) || []).length !== 1 ||
     (next.match(/<script data-bg-context-slider-readable>/g) || []).length !== 1) {
    throw new Error('Homepage context slider responsive guard kon niet volledig worden toegepast');
  }
  return next;
}
