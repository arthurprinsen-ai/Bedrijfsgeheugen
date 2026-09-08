const MARKER = 'data-bg-context-slider-readable';
const FALLBACK_MARKER = 'data-bg-context-slider-aria-fallback';
const SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
const RUNTIME_SRC = '/assets/compare-slider-runtime.js';

const STYLE = `<style ${MARKER}>
[data-bg-compare-slider]{--split:50%;--bg-compare-split:var(--split,50%);position:relative!important;overflow:hidden!important;touch-action:pan-y}
[data-bg-compare-slider]:has(.compare-knob:is([aria-valuenow="0"],[aria-valuenow="1"],[aria-valuenow="2"],[aria-valuenow="3"],[aria-valuenow="4"],[aria-valuenow="5"],[aria-valuenow="6"],[aria-valuenow="7"],[aria-valuenow="8"])){--bg-compare-split:0%}
[data-bg-compare-slider]:has(.compare-knob:is([aria-valuenow="92"],[aria-valuenow="93"],[aria-valuenow="94"],[aria-valuenow="95"],[aria-valuenow="96"],[aria-valuenow="97"],[aria-valuenow="98"],[aria-valuenow="99"],[aria-valuenow="100"])){--bg-compare-split:100%}
[data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important}
[data-bg-compare-slider] .compare-before{clip-path:inset(0 calc(100% - var(--bg-compare-split,50%)) 0 0)!important}
[data-bg-compare-slider] .compare-after{clip-path:inset(0 0 0 var(--bg-compare-split,50%))!important}
[data-bg-compare-slider] .compare-before .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:0!important;margin-right:auto!important;padding-right:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-after .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:auto!important;margin-right:0!important;padding-left:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-handle{display:block!important;position:absolute!important;left:clamp(24px,var(--bg-compare-split,50%),calc(100% - 24px))!important;z-index:20!important}
[data-bg-compare-slider] .compare-knob{pointer-events:auto!important}
[data-bg-change-check-source="true"]{opacity:1!important;visibility:visible!important;filter:none!important;transform:none!important}
.bg-change-progress,.bg-change-flow-check,.bg-change-impact{display:none}
@media(max-width:720px){
  [data-bg-compare-slider]{min-height:360px!important;overflow:hidden!important}
  [data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important;transform:none!important}
  [data-bg-compare-slider] .compare-copy{width:calc(100% - 36px)!important;max-width:none!important;overflow:visible!important;transform:none!important}
  [data-bg-compare-slider] .compare-copy h2,[data-bg-compare-slider] .compare-copy h3,[data-bg-compare-slider] .compare-copy p,[data-bg-compare-slider] .compare-copy li{max-width:none!important;overflow-wrap:normal!important;word-break:normal!important;hyphens:auto}
  [data-bg-compare-slider] .compare-handle{display:block!important}

  [data-bg-change-flow]{--bg-change-progress:0;position:relative!important}
  [data-bg-change-flow] [data-bg-change-step]{position:relative!important;opacity:.48!important;filter:saturate(.45);transition:opacity .22s ease,filter .22s ease}
  [data-bg-change-flow] [data-bg-change-step][data-bg-change-status="active"],
  [data-bg-change-flow] [data-bg-change-step][data-bg-change-status="done"]{opacity:1!important;filter:none!important}
  [data-bg-change-flow] [data-bg-change-check-source="true"]{display:none!important}
  .bg-change-progress{position:absolute;display:block;width:4px;border-radius:999px;background:rgba(151,161,171,.24);z-index:1;pointer-events:none;overflow:hidden}
  .bg-change-progress-fill{display:block;width:100%;height:calc(var(--bg-change-progress,0) * 100%);min-height:4px;border-radius:999px;background:#FFE86B;transition:height .14s linear}
  .bg-change-flow-check{position:absolute;left:54px;top:28px;width:42px;height:42px;border-radius:999px;display:grid;place-items:center;border:2px solid #5d6670;background:#171b1f;color:transparent;font:900 23px/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;z-index:2;box-sizing:border-box;transition:background .2s ease,border-color .2s ease,color .2s ease}
  [data-bg-change-step][data-bg-change-status="active"] .bg-change-flow-check{border-color:#FFE86B;box-shadow:0 0 0 4px rgba(255,232,107,.12)}
  [data-bg-change-step][data-bg-change-status="active"] .bg-change-flow-check::after{content:"";width:9px;height:9px;border-radius:999px;background:#FFE86B}
  [data-bg-change-step][data-bg-change-status="done"] .bg-change-flow-check{background:#E4F8ED;border-color:#E4F8ED;color:#087A4B;box-shadow:none}
  [data-bg-change-step][data-bg-change-status="done"] .bg-change-flow-check::after{content:none}
  .bg-change-impact{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:18px 0 4px;color:#B8C2CB;font-size:12px;font-weight:700;line-height:1.2}
  .bg-change-impact span{display:inline-flex;align-items:center;min-height:30px;padding:6px 9px;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(255,255,255,.045);white-space:nowrap}
  .bg-change-impact i{font-style:normal;color:#FFE86B;font-weight:900}
}
@media(max-width:380px){
  .bg-change-flow-check{left:48px;width:38px;height:38px;font-size:21px}
  .bg-change-impact{gap:5px}
  .bg-change-impact span{font-size:11px;padding:5px 7px}
}
@media(prefers-reduced-motion:reduce){
  [data-bg-change-flow] [data-bg-change-step],.bg-change-progress-fill,.bg-change-flow-check{transition:none!important}
}
</style>`;

const RUNTIME_TAG = `<script ${MARKER} src="${RUNTIME_SRC}" defer></script>`;
const FALLBACK_TAG = `<script ${FALLBACK_MARKER}>(function(){var q='${SLIDER_SELECTOR}';function n(v){v=Math.max(0,Math.min(100,Number(v)||0));return v<=8?0:v>=92?100:v}function s(el){if(!el)return;el.setAttribute('data-bg-compare-slider','');el.setAttribute('data-bg-compare-ready','true');var k=el.querySelector('.compare-knob');if(!k)return;var v=n(parseFloat(getComputedStyle(el).getPropertyValue('--split')));k.setAttribute('aria-valuemin','0');k.setAttribute('aria-valuemax','100');k.setAttribute('aria-valuenow',String(Math.round(v)));k.setAttribute('aria-disabled','false');if(k.tabIndex<0)k.tabIndex=0}function a(){document.querySelectorAll(q).forEach(function(el){s(el);if(el.getAttribute('data-bg-aria-observed')==='true')return;el.setAttribute('data-bg-aria-observed','true');new MutationObserver(function(){s(el)}).observe(el,{attributes:true,attributeFilter:['style']})})}a();new MutationObserver(a).observe(document.documentElement,{childList:true,subtree:true});})();</script>`;

function normalizeLegacyBounds(html){
  return html
    .replace(/Math\.max\((?:8|6|30|40),\s*Math\.min\((?:92|94|70|60),/g, 'Math.max(0,Math.min(100,')
    .replace(/aria-valuemin=(['"])(?:6|8|30|40)\1/g, 'aria-valuemin="0"')
    .replace(/aria-valuemax=(['"])(?:94|92|70|60)\1/g, 'aria-valuemax="100"');
}

function stripExistingGuard(html){
  return html
    .replace(/<style\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script\s+data-bg-context-slider-aria-fallback\b[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function applyHomepageContextSliderReadability(html){
  let next=stripExistingGuard(normalizeLegacyBounds(html));
  next=next.replace('</head>',`${STYLE}\n</head>`);
  next=next.replace('</body>',`${RUNTIME_TAG}\n${FALLBACK_TAG}\n</body>`);
  if(!next.includes('data-bg-compare-slider')||
     !next.includes('--bg-compare-split:var(--split,50%)')||
     !next.includes('[aria-valuenow="6"]')||
     !next.includes('[aria-valuenow="94"]')||
     !next.includes(RUNTIME_SRC)||
     !next.includes(FALLBACK_MARKER)||
     !next.includes("aria-valuenow',String(Math.round(v))")||
     !next.includes('data-bg-change-flow')||
     !next.includes('data-bg-change-progress')||
     !next.includes('data-bg-change-status')||
     (next.match(/<style data-bg-context-slider-readable>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime\.js"\s+defer><\/script>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-aria-fallback>/g)||[]).length!==1){
    throw new Error('Compare-slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}

export { SLIDER_SELECTOR, RUNTIME_SRC };
