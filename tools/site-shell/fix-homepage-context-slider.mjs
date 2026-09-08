const MARKER = 'data-bg-context-slider-readable';
const LEGACY_FALLBACK_MARKER = 'data-bg-context-slider-aria-fallback';
const POINTER_OWNER_MARKER = 'data-bg-compare-pointer-owner';
const SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
const RUNTIME_SRC = '/assets/compare-slider-runtime.js';
const RUNTIME_VERSION = 'full-endpoints-v7-responsive-flow';

const STYLE = `<style ${MARKER}>
[data-bg-compare-slider]{--split:50%;--bg-compare-split:var(--split,50%);position:relative!important;overflow:hidden!important;touch-action:pan-y;cursor:ew-resize!important}
[data-bg-compare-slider]:has(.compare-knob:is([aria-valuenow="0"],[aria-valuenow="1"],[aria-valuenow="2"],[aria-valuenow="3"],[aria-valuenow="4"],[aria-valuenow="5"],[aria-valuenow="6"],[aria-valuenow="7"],[aria-valuenow="8"])){--bg-compare-split:0%}
[data-bg-compare-slider]:has(.compare-knob:is([aria-valuenow="92"],[aria-valuenow="93"],[aria-valuenow="94"],[aria-valuenow="95"],[aria-valuenow="96"],[aria-valuenow="97"],[aria-valuenow="98"],[aria-valuenow="99"],[aria-valuenow="100"])){--bg-compare-split:100%}
[data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important}
[data-bg-compare-slider] .compare-before{clip-path:inset(0 calc(100% - var(--bg-compare-split,50%)) 0 0)!important}
[data-bg-compare-slider] .compare-after{clip-path:inset(0 0 0 var(--bg-compare-split,50%))!important}
[data-bg-compare-slider] .compare-before .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:0!important;margin-right:auto!important;padding-right:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-after .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:auto!important;margin-right:0!important;padding-left:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-handle{display:block!important;position:absolute!important;left:var(--bg-compare-split,50%)!important;z-index:20!important;pointer-events:none!important}
[data-bg-compare-slider] .compare-knob{pointer-events:none!important}
[data-bg-compare-slider] .bg-compare-hit{position:absolute!important;inset:0!important;display:block!important;z-index:35!important;background:transparent!important;cursor:ew-resize!important;touch-action:pan-y!important;-webkit-user-select:none!important;user-select:none!important}

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
  [data-bg-compare-slider] .compare-handle{display:block!important}
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

const RUNTIME_TAG = `<script ${MARKER} src="${RUNTIME_SRC}"></script>`;

// Sole gesture owner. This runs before compare-slider-runtime.js and marks each
// slider with that runtime's current version, so the external runtime keeps its
// unrelated change-flow behavior but deliberately skips installing a second
// compare-slider gesture engine. A transparent full-card hit layer receives
// Pointer Events and keeps pointer capture while the finger leaves the card.
const POINTER_OWNER_TAG = `<script ${POINTER_OWNER_MARKER}>(function(){'use strict';var q='${SLIDER_SELECTOR}',VERSION='${RUNTIME_VERSION}',EDGE_SNAP_PX=48,T=8;function n(v){v=Math.max(0,Math.min(100,Number(v)||0));return v<=T?0:v>=100-T?100:v}function render(slider,v){v=n(v);var p=v.toFixed(2)+'%',b=slider.querySelector('.compare-before'),a=slider.querySelector('.compare-after'),h=slider.querySelector('.compare-handle'),k=slider.querySelector('.compare-knob'),mobile=window.matchMedia&&window.matchMedia('(max-width:720px)').matches;slider.style.setProperty('--split',p);slider.style.setProperty('--bg-compare-split',p);if(mobile&&v<=20)slider.setAttribute('data-bg-readable-side','after');else if(mobile&&v>=80)slider.setAttribute('data-bg-readable-side','before');else slider.removeAttribute('data-bg-readable-side');if(b)b.style.setProperty('clip-path','inset(0 '+(100-v).toFixed(2)+'% 0 0)','important');if(a)a.style.setProperty('clip-path','inset(0 0 0 '+v.toFixed(2)+'%)','important');if(h)h.style.setProperty('left',p,'important');if(k){k.setAttribute('aria-valuemin','0');k.setAttribute('aria-valuemax','100');k.setAttribute('aria-valuenow',String(Math.round(v)));k.setAttribute('aria-disabled','false');k.tabIndex=0}return v}function apply(slider,clientX){var r=slider.getBoundingClientRect();if(!r.width)return render(slider,50);if(clientX<=r.left+EDGE_SNAP_PX)return render(slider,0);if(clientX>=r.right-EDGE_SNAP_PX)return render(slider,100);var x=Math.max(0,Math.min(r.width,clientX-r.left));return render(slider,(x/r.width)*100)}function ensureHit(slider){var old=slider.querySelector(':scope > .bg-compare-hit');if(old)return old;var hit=document.createElement('span');hit.className='bg-compare-hit';hit.setAttribute('aria-hidden','true');slider.appendChild(hit);return hit}function own(slider){if(slider.getAttribute('data-bg-pointer-owner-ready')==='true')return slider;var clone=slider.cloneNode(true);clone.querySelectorAll('.bg-compare-hit').forEach(function(x){x.remove()});clone.setAttribute('data-bg-compare-slider','');clone.setAttribute('data-bg-compare-ready','true');clone.setAttribute('data-bg-compare-owner','canonical');clone.setAttribute('data-bg-compare-version',VERSION);clone.setAttribute('data-bg-pointer-owner-ready','true');clone.removeAttribute('data-bg-pointer-listeners');slider.replaceWith(clone);return clone}function init(slider){if(!slider||!slider.querySelector('.compare-before')||!slider.querySelector('.compare-after'))return;if(slider.getAttribute('data-bg-pointer-owner-ready')!=='true')slider=own(slider);var hit=ensureHit(slider);if(slider.getAttribute('data-bg-pointer-listeners')==='true')return;slider.setAttribute('data-bg-pointer-listeners','true');var dragging=false,pid=null,k=slider.querySelector('.compare-knob');function start(e){if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;pid=e.pointerId;if(hit.setPointerCapture)try{hit.setPointerCapture(e.pointerId)}catch(_e){}apply(slider,e.clientX);if(e.pointerType==='mouse')e.preventDefault();e.stopImmediatePropagation()}function move(e){if(!dragging||e.pointerId!==pid)return;apply(slider,e.clientX);if(e.pointerType==='mouse')e.preventDefault();e.stopImmediatePropagation()}function finish(e){if(!dragging||e.pointerId!==pid)return;apply(slider,e.clientX);dragging=false;if(hit.releasePointerCapture)try{hit.releasePointerCapture(e.pointerId)}catch(_e){}pid=null;if(e.pointerType==='mouse')e.preventDefault();e.stopImmediatePropagation()}hit.addEventListener('pointerdown',start,true);hit.addEventListener('pointermove',move,true);hit.addEventListener('pointerup',finish,true);hit.addEventListener('pointercancel',function(e){if(e.pointerId===pid){dragging=false;pid=null}},true);if(k)k.addEventListener('keydown',function(e){var raw=parseFloat(slider.style.getPropertyValue('--bg-compare-split'));var v=Number.isFinite(raw)?raw:50;if(e.key==='ArrowLeft')v-=5;else if(e.key==='ArrowRight')v+=5;else if(e.key==='Home')v=0;else if(e.key==='End')v=100;else return;e.preventDefault();e.stopImmediatePropagation();render(slider,v)},true);var raw=parseFloat(getComputedStyle(slider).getPropertyValue('--bg-compare-split'));if(!Number.isFinite(raw))raw=parseFloat(getComputedStyle(slider).getPropertyValue('--split'));render(slider,Number.isFinite(raw)?raw:50)}function all(){document.querySelectorAll(q).forEach(init);document.querySelectorAll('.compare-before').forEach(function(b){var p=b.parentElement;if(p&&p.querySelector('.compare-after'))init(p)})}all();new MutationObserver(all).observe(document.documentElement,{childList:true,subtree:true})})();</script>`;

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
    .replace(/<script\s+data-bg-context-slider-aria-fallback\b[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script\s+data-bg-compare-pointer-owner\b[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function applyHomepageContextSliderReadability(html){
  let next=stripExistingGuard(normalizeLegacyBounds(html));
  next=next.replace('</head>',`${STYLE}\n</head>`);
  next=next.replace('</body>',`${POINTER_OWNER_TAG}\n${RUNTIME_TAG}\n</body>`);
  if(!next.includes('data-bg-compare-slider')||
     !next.includes('--bg-compare-split:var(--split,50%)')||
     !next.includes('[aria-valuenow="6"]')||
     !next.includes('[aria-valuenow="94"]')||
     !next.includes(RUNTIME_SRC)||
     !next.includes(POINTER_OWNER_MARKER)||
     !next.includes('data-bg-pointer-owner-ready')||
     !next.includes('bg-compare-hit')||
     !next.includes('EDGE_SNAP_PX=48')||
     !next.includes('setPointerCapture')||
     !next.includes('releasePointerCapture')||
     !next.includes('data-bg-change-flow')||
     !next.includes('data-bg-change-progress')||
     !next.includes('data-bg-change-status')||
     !next.includes('--bg-change-rail-width')||
     !next.includes('bg-change-step-rail')||
     !next.includes('bg-change-step-content')||
     !next.includes('bgx-lek-uit-flow')||
     (next.match(/<style data-bg-context-slider-readable>/g)||[]).length!==1||
     (next.match(/<script data-bg-compare-pointer-owner>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-readable\s+src="\/assets\/compare-slider-runtime\.js"><\/script>/g)||[]).length!==1){
    throw new Error('Compare-slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}

export { SLIDER_SELECTOR, RUNTIME_SRC, RUNTIME_VERSION };