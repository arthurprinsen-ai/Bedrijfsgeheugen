const MARKER = 'data-bg-context-slider-readable';
const SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
const RUNTIME_SRC = '/assets/compare-slider-runtime-native-range-v13.js';

const STYLE = `<style ${MARKER}>
[data-bg-compare-slider]{--split:50%;--bg-compare-split:var(--split,50%);position:relative!important;overflow:hidden!important;cursor:ew-resize!important}
[data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important}
[data-bg-compare-slider] .compare-before{clip-path:inset(0 calc(100% - var(--bg-compare-split,50%)) 0 0)!important}
[data-bg-compare-slider] .compare-after{clip-path:inset(0 0 0 var(--bg-compare-split,50%))!important}
[data-bg-compare-slider] .compare-before .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:0!important;margin-right:auto!important;padding-right:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-after .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:auto!important;margin-right:0!important;padding-left:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-handle,[data-bg-compare-slider] .compare-knob{pointer-events:none!important}
[data-bg-compare-slider] .bg-compare-range{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;margin:0!important;padding:0!important;z-index:30!important;opacity:.001!important;cursor:ew-resize!important}
[data-bg-compare-slider] .bg-compare-divider{position:absolute!important;top:0!important;bottom:0!important;left:var(--bg-compare-split,50%)!important;width:4px!important;background:#FFE86B!important;z-index:20!important;pointer-events:none!important;transform:translateX(-50%)!important}
[data-bg-compare-slider][data-bg-compare-endpoint="start"] .bg-compare-divider{transform:translateX(0)!important}
[data-bg-compare-slider][data-bg-compare-endpoint="end"] .bg-compare-divider{transform:translateX(-100%)!important}

[data-bg-change-flow]{--bg-change-progress:0;--bg-change-rail-width:64px;position:relative!important;max-width:100%!important}
[data-bg-change-flow] [data-bg-change-step]{--bg-step-progress:0;display:grid!important;grid-template-columns:var(--bg-change-rail-width) minmax(0,1fr)!important;column-gap:18px!important;align-items:stretch!important;position:relative!important;max-width:100%!important;opacity:.48!important;filter:saturate(.45);transition:opacity .22s ease,filter .22s ease}
[data-bg-change-flow] [data-bg-change-step][data-bg-change-status="active"],
[data-bg-change-flow] [data-bg-change-step][data-bg-change-status="done"]{opacity:1!important;filter:none!important}
[data-bg-change-flow] [data-bg-change-check-source="true"]{display:none!important}
[data-bg-change-progress]{min-width:0}
.bg-change-progress{display:none}
.bg-change-step-rail{grid-column:1;grid-row:1;position:relative;display:flex;justify-content:center;align-items:flex-start;min-width:0;overflow:visible;padding-top:2px}
.bg-change-step-content{grid-column:2;grid-row:1;min-width:0;max-width:100%;overflow:visible}
.bg-change-flow-check{position:relative;width:42px;height:42px;border-radius:999px;display:grid;place-items:center;border:2px solid #5d6670;background:#171b1f;color:transparent;font:900 23px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:2;box-sizing:border-box;transition:background .2s ease,border-color .2s ease,color .2s ease,box-shadow .2s ease;flex:none}
.bg-change-step-rail::after{content:"";position:absolute;left:50%;transform:translateX(-50%);top:42px;bottom:-2px;width:4px;border-radius:999px;background:rgba(151,161,171,.24);z-index:0;pointer-events:none}
[data-bg-change-step]:last-of-type .bg-change-step-rail::after{display:none}
.bg-change-step-fill{position:absolute;left:50%;transform:translateX(-50%) scaleY(var(--bg-step-progress,0));transform-origin:top;top:42px;bottom:-2px;width:4px;border-radius:999px;background:#FFE86B;z-index:1;pointer-events:none;transition:transform .14s linear}
[data-bg-change-step]:last-of-type .bg-change-step-fill{display:none}
[data-bg-change-step][data-bg-change-status="active"] .bg-change-flow-check{border-color:#FFE86B;box-shadow:0 0 0 4px rgba(255,232,107,.12)}
[data-bg-change-step][data-bg-change-status="active"] .bg-change-flow-check::after{content:"";width:9px;height:9px;border-radius:999px;background:#FFE86B}
[data-bg-change-step][data-bg-change-status="done"] .bg-change-flow-check{background:#E4F8ED;border-color:#E4F8ED;color:#087A4B;box-shadow:none}
[data-bg-change-step][data-bg-change-status="done"] .bg-change-flow-check::after{content:none}
.bg-change-impact{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:18px 0 4px;color:#B8C2CB;font-size:12px;font-weight:700;line-height:1.2;max-width:100%}
.bg-change-impact span{display:inline-flex;align-items:center;min-height:30px;padding:6px 9px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.045);white-space:nowrap;max-width:100%}
.bg-change-impact i{font-style:normal;color:#FFE86B;font-weight:900;flex:none}

@media(max-width:720px){
  [data-bg-compare-slider]{min-height:360px!important;overflow:hidden!important}
  [data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;transform:none!important}
  [data-bg-compare-slider] .compare-copy{width:calc(100% - 36px)!important;max-width:none!important;overflow:visible!important;transform:none!important;transition:opacity .12s ease!important}
  [data-bg-compare-slider] .compare-copy h2,[data-bg-compare-slider] .compare-copy h3,[data-bg-compare-slider] .compare-copy p,[data-bg-compare-slider] .compare-copy li{max-width:none!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:auto}
  [data-bg-compare-slider][data-bg-readable-side="before"] .compare-after .compare-copy{opacity:0!important;visibility:hidden!important}
  [data-bg-compare-slider][data-bg-readable-side="after"] .compare-before .compare-copy{opacity:0!important;visibility:hidden!important}
  [data-bg-compare-slider][data-bg-readable-side="before"] .compare-before .compare-copy,[data-bg-compare-slider][data-bg-readable-side="after"] .compare-after .compare-copy{opacity:1!important;visibility:visible!important}
  [data-bg-compare-slider] .compare-handle{display:none!important}
  [data-bg-change-flow]{--bg-change-rail-width:54px}
  [data-bg-change-flow] [data-bg-change-step]{column-gap:12px!important}
  .bg-change-flow-check{width:38px;height:38px;font-size:21px}
  .bg-change-step-rail::after,.bg-change-step-fill{top:38px;width:3px}
  .bg-change-impact{gap:6px;margin-top:14px}
  .bg-change-impact span{font-size:11.5px;padding:5px 8px}
  .bgx-lek{bottom:calc(12px + env(safe-area-inset-bottom,0px))!important}
  .bgx-lek.bgx-lek-uit-flow{transform:translateY(calc(140% + 24px)) rotate(-2deg)!important;pointer-events:none!important}
}
@media(max-width:420px){
  [data-bg-change-flow]{--bg-change-rail-width:46px}
  [data-bg-change-flow] [data-bg-change-step]{column-gap:10px!important}
  .bg-change-flow-check{width:34px;height:34px;font-size:19px}
  .bg-change-step-rail::after,.bg-change-step-fill{top:34px}
  .bg-change-impact i{display:none}
  .bg-change-impact{gap:5px}
  .bg-change-impact span{font-size:11px;padding:5px 7px;white-space:normal;text-align:center}
}
@media(min-width:721px) and (max-width:1100px){
  [data-bg-change-flow]{--bg-change-rail-width:58px}
}
@media(prefers-reduced-motion:reduce){
  [data-bg-change-flow] [data-bg-change-step],.bg-change-step-fill,.bg-change-flow-check,[data-bg-compare-slider] .compare-copy{transition:none!important}
}
</style>`;

const BOOTSTRAP_TAG = `<script data-bg-compare-bootstrap>(function(){function mount(){document.querySelectorAll('#compareSlider,.compare-slider,[data-compare-slider]').forEach(function(slider){if(!slider.querySelector('.compare-before')||!slider.querySelector('.compare-after'))return;slider.setAttribute('data-bg-compare-slider','');slider.setAttribute('data-bg-compare-version','native-range-v13');var divider=slider.querySelector('.bg-compare-divider');if(!divider){divider=document.createElement('span');divider.className='bg-compare-divider';divider.setAttribute('aria-hidden','true');slider.appendChild(divider);}var range=slider.querySelector('.bg-compare-range');if(!range){range=document.createElement('input');range.className='bg-compare-range';range.type='range';range.min='0';range.max='100';range.step='1';range.value='50';range.setAttribute('aria-label','Vergelijk huidige en gewenste situatie');slider.appendChild(range);}function render(){var value=Math.max(0,Math.min(100,Number(range.value)||0));var pct=value.toFixed(2)+'%';slider.style.setProperty('--bg-compare-split',pct);slider.style.setProperty('--split',pct);var before=slider.querySelector('.compare-before');var after=slider.querySelector('.compare-after');if(before)before.style.setProperty('clip-path','inset(0 '+(100-value).toFixed(2)+'% 0 0)','important');if(after)after.style.setProperty('clip-path','inset(0 0 0 '+value.toFixed(2)+'%)','important');slider.setAttribute('data-bg-compare-endpoint',value===0?'start':value===100?'end':'middle');}range.addEventListener('input',render);range.addEventListener('change',render);render();});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();})();</script>`;
const RUNTIME_TAG = `<script ${MARKER} src="${RUNTIME_SRC}"></script>`;

function normalizeLegacyBounds(html){
  return html
    .replace(/Math\.max\((?:8|6|30|40),\s*Math\.min\((?:92|94|70|60),/g, 'Math.max(0,Math.min(100,')
    .replace(/aria-valuemin=(['"])(?:6|8|30|40)\1/g, 'aria-valuemin="0"')
    .replace(/aria-valuemax=(['"])(?:94|92|70|60)\1/g, 'aria-valuemax="100"');
}

function stripExistingGuard(html){
  return html
    .replace(/<style\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\s+data-bg-compare-bootstrap\b[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function applyHomepageContextSliderReadability(html){
  let next=stripExistingGuard(normalizeLegacyBounds(html));
  next=next.replace('</head>',`${STYLE}\n</head>`);
  next=next.replace('</body>',`${BOOTSTRAP_TAG}\n${RUNTIME_TAG}\n</body>`);
  if(!next.includes('data-bg-compare-slider')||
     !next.includes('--bg-compare-split:var(--split,50%)')||
     !next.includes('bg-compare-range')||
     !next.includes('bg-compare-divider')||
     !next.includes('data-bg-compare-bootstrap')||
     !next.includes(RUNTIME_SRC)||
     !next.includes('data-bg-change-flow')||
     !next.includes('data-bg-change-progress')||
     !next.includes('data-bg-change-status')||
     !next.includes('--bg-change-rail-width')||
     !next.includes('bg-change-step-rail')||
     !next.includes('bg-change-step-content')||
     !next.includes('bgx-lek-uit-flow')||
     (next.match(/<style data-bg-context-slider-readable>/g)||[]).length!==1||
     (next.match(/<script data-bg-compare-bootstrap>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime-native-range-v13\.js"><\/script>/g)||[]).length!==1){
    throw new Error('Compare-slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}

export { SLIDER_SELECTOR, RUNTIME_SRC };