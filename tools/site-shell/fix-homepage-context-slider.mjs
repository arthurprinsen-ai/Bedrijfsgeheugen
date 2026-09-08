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
[data-bg-compare-slider] .compare-handle{display:block!important;position:absolute!important;left:var(--bg-compare-split,50%)!important;z-index:20!important}
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
     (next.match(/<style data-bg-context-slider-readable>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime\.js"\s+defer><\/script>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-aria-fallback>/g)||[]).length!==1){
    throw new Error('Compare-slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}

export { SLIDER_SELECTOR, RUNTIME_SRC };
