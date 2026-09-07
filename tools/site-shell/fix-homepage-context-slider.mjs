const MARKER = 'data-bg-context-slider-readable';
const MIN_DESKTOP_PANE_PX = 320;
const MIN_COMPACT_PANE_PX = 240;
const HANDLE_GUTTER_PX = 64;
const MOBILE_MIN_PCT = 18;
const MOBILE_MAX_PCT = 82;

const STYLE = `<style ${MARKER}>
#compareSlider{--bg-compare-gutter:${HANDLE_GUTTER_PX}px}
#compareSlider .compare-before .compare-copy{width:min(460px,calc(var(--split,50%) - 108px));max-width:none;padding-right:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-after .compare-copy{width:min(460px,calc(100% - var(--split,50%) - 108px));max-width:none;margin-left:auto;padding-left:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-handle{z-index:8}
#compareSlider[data-bg-compare-compact="true"]{position:relative!important;display:block!important;height:clamp(430px,122vw,540px)!important;min-height:430px!important;overflow:hidden!important;background:transparent!important;box-shadow:none!important;touch-action:pan-y!important}
#compareSlider[data-bg-compare-compact="true"] .compare-before,
#compareSlider[data-bg-compare-compact="true"] .compare-after{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;padding:24px!important;border-radius:24px!important;min-height:0!important;transform:none!important}
#compareSlider[data-bg-compare-compact="true"] .compare-before{clip-path:inset(0 calc(100% - var(--split,50%)) 0 0)!important}
#compareSlider[data-bg-compare-compact="true"] .compare-after{clip-path:inset(0 0 0 var(--split,50%))!important}
#compareSlider[data-bg-compare-compact="true"] .compare-before .compare-copy,
#compareSlider[data-bg-compare-compact="true"] .compare-after .compare-copy{width:calc(100% - 48px)!important;max-width:none!important;padding:0!important;position:absolute!important;top:24px!important;transform:none!important;box-sizing:border-box!important}
#compareSlider[data-bg-compare-compact="true"] .compare-before .compare-copy{left:24px!important;right:auto!important;margin:0!important}
#compareSlider[data-bg-compare-compact="true"] .compare-after .compare-copy{right:24px!important;left:auto!important;margin:0!important}
#compareSlider[data-bg-compare-compact="true"] .compare-handle{display:flex!important;z-index:12!important;touch-action:none!important}
#compareSlider[data-bg-compare-compact="true"] .compare-knob{display:flex!important;touch-action:none!important;-webkit-user-select:none!important;user-select:none!important}
@media(max-width:767px){[data-bg-story-cost]{display:none!important}}
</style>`;

const RUNTIME = `<script ${MARKER}>
(function(){
  var MIN_DESKTOP_PANE_PX = ${MIN_DESKTOP_PANE_PX};
  var MIN_COMPACT_PANE_PX = ${MIN_COMPACT_PANE_PX};
  var HANDLE_GUTTER_PX = ${HANDLE_GUTTER_PX};
  var MOBILE_MIN_PCT = ${MOBILE_MIN_PCT};
  var MOBILE_MAX_PCT = ${MOBILE_MAX_PCT};
  var slider = document.getElementById('compareSlider');
  if(!slider) return;
  var knob = slider.querySelector('.compare-knob');
  var handle = slider.querySelector('.compare-handle');
  var dragging = false;

  function getLimits(){
    var r = slider.getBoundingClientRect();
    var compactThreshold = (MIN_COMPACT_PANE_PX * 2) + (HANDLE_GUTTER_PX * 2) + 88;
    var compact = r.width < compactThreshold;
    slider.setAttribute('data-bg-compare-compact', compact ? 'true' : 'false');
    if(compact) return {min:MOBILE_MIN_PCT,max:MOBILE_MAX_PCT,compact:true};
    var safePanePx = MIN_DESKTOP_PANE_PX + HANDLE_GUTTER_PX + 44;
    var minPct = Math.min(45, safePanePx / Math.max(1,r.width) * 100);
    return {min:minPct,max:100-minPct,compact:false};
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

  function normalize(){ apply(current()); }

  slider.addEventListener('pointerdown',function(e){
    var limits = getLimits();
    var hitHandle = !!(handle && (e.target===handle || handle.contains(e.target)));
    if(limits.compact && !hitHandle) return;
    dragging = true;
    if(knob && hitHandle) knob.setPointerCapture?.(e.pointerId);
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
     !next.includes('MOBILE_MIN_PCT = 18') ||
     !next.includes('MOBILE_MAX_PCT = 82') ||
     !next.includes('applyFromClientX') ||
     !next.includes('data-bg-compare-compact') ||
     (next.match(/<style data-bg-context-slider-readable>/g) || []).length !== 1 ||
     (next.match(/<script data-bg-context-slider-readable>/g) || []).length !== 1) {
    throw new Error('Homepage context slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}