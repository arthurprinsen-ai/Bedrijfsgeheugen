const MARKER = 'data-bg-context-slider-readable';
const MIN_DESKTOP_PANE_PX = 320;
const MIN_COMPACT_PANE_PX = 240;
const HANDLE_GUTTER_PX = 64;

const STYLE = `<style ${MARKER}>
#compareSlider{--bg-compare-gutter:${HANDLE_GUTTER_PX}px}
#compareSlider .compare-before .compare-copy{width:min(460px,calc(var(--split,50%) - 108px));max-width:none;padding-right:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-after .compare-copy{width:min(460px,calc(100% - var(--split,50%) - 108px));max-width:none;margin-left:auto;padding-left:var(--bg-compare-gutter);box-sizing:border-box}
#compareSlider .compare-handle{z-index:8}
#compareSlider[data-bg-compare-compact="true"]{height:auto!important;overflow:visible!important;display:grid!important;gap:14px!important;background:transparent!important;box-shadow:none!important}
#compareSlider[data-bg-compare-compact="true"] .compare-side{position:relative!important;inset:auto!important;clip-path:none!important;padding:24px!important;border-radius:24px!important;min-height:0!important}
#compareSlider[data-bg-compare-compact="true"] .compare-copy{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
#compareSlider[data-bg-compare-compact="true"] .compare-handle{display:none!important}
</style>`;

const RUNTIME = `<script ${MARKER}>
(function(){
  var MIN_DESKTOP_PANE_PX = ${MIN_DESKTOP_PANE_PX};
  var MIN_COMPACT_PANE_PX = ${MIN_COMPACT_PANE_PX};
  var HANDLE_GUTTER_PX = ${HANDLE_GUTTER_PX};
  var slider = document.getElementById('compareSlider');
  if(!slider) return;
  var knob = slider.querySelector('.compare-knob');
  function limits(){
    var r = slider.getBoundingClientRect();
    var compactThreshold = (MIN_COMPACT_PANE_PX * 2) + (HANDLE_GUTTER_PX * 2) + 88;
    var compact = r.width < compactThreshold;
    slider.setAttribute('data-bg-compare-compact', compact ? 'true' : 'false');
    if(compact) return {min:50,max:50,compact:true};
    var safePanePx = MIN_DESKTOP_PANE_PX + HANDLE_GUTTER_PX + 44;
    var minPct = Math.min(45, safePanePx / Math.max(1,r.width) * 100);
    return {min:minPct,max:100-minPct,compact:false};
  }
  function apply(raw){
    var limitsNow = limits();
    var value = limitsNow.compact ? 50 : Math.max(limitsNow.min, Math.min(limitsNow.max, raw));
    slider.style.setProperty('--split', value.toFixed(2) + '%');
    if(knob){
      knob.setAttribute('aria-valuemin', limitsNow.min.toFixed(0));
      knob.setAttribute('aria-valuemax', limitsNow.max.toFixed(0));
      knob.setAttribute('aria-valuenow', value.toFixed(0));
      knob.setAttribute('aria-disabled', limitsNow.compact ? 'true' : 'false');
    }
  }
  function normalize(){
    var raw = parseFloat(getComputedStyle(slider).getPropertyValue('--split'));
    apply(Number.isFinite(raw) ? raw : 50);
  }
  ['pointerdown','pointermove','pointerup','pointercancel'].forEach(function(name){
    slider.addEventListener(name,function(){setTimeout(normalize,0);});
  });
  window.addEventListener('pointermove',function(){setTimeout(normalize,0);});
  if(knob){
    knob.addEventListener('keydown',function(e){
      if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='Home'||e.key==='End') setTimeout(normalize,0);
    });
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

export function applyHomepageContextSliderReadability(html){
  if(!/id=(['"])compareSlider\1/.test(html)) return html;
  let next = normalizeLegacyBounds(html);
  if(!next.includes(`<style ${MARKER}>`)) next = next.replace('</head>', `${STYLE}\n</head>`);
  if(!next.includes(`<script ${MARKER}>`)) next = next.replace('</body>', `${RUNTIME}\n</body>`);
  if(!next.includes('.compare-before .compare-copy') ||
     !next.includes('.compare-after .compare-copy') ||
     !next.includes('MIN_DESKTOP_PANE_PX = 320') ||
     !next.includes('MIN_COMPACT_PANE_PX = 240') ||
     !next.includes('HANDLE_GUTTER_PX = 64') ||
     !next.includes("data-bg-compare-compact") ||
     !next.includes(MARKER)) {
    throw new Error('Homepage context slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}
