/* Bedrijfsgeheugen public-site interaction recovery: idempotent, no parallel menu/slider engine. */
(function () {
  'use strict';
  var MENUS = [
    { id:'bgMobileNav', toggle:'mobileToggle' },
    { id:'bgSharedMobileNav', toggle:'bgkopKnop' },
    { id:'v18MobileDrawer', toggle:'mobileToggle' }
  ];
  function activeMenu() {
    for (var i=0;i<MENUS.length;i++) {
      var config=MENUS[i], nav=document.getElementById(config.id);
      if (!nav) continue;
      if (nav.getAttribute('aria-hidden')==='false' || nav.classList.contains('open')) {
        return {nav:nav,toggle:document.getElementById(config.toggle)};
      }
    }
    return null;
  }
  function closeMenu(state) {
    if (!state) return;
    var nav=state.nav,toggle=state.toggle;
    nav.setAttribute('aria-hidden','true');
    nav.classList.remove('open');
    if (toggle) {
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Open menu');
      var label=toggle.querySelector('.bg-mobile-menu-label');
      if (label) label.textContent='Menu';
    }
    var legacy=document.getElementById('v18MobileDrawer');
    if (legacy && legacy!==nav) {
      legacy.setAttribute('aria-hidden','true');
      legacy.classList.remove('open');
    }
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
    nav.querySelectorAll('[data-bg-mobile-view],[data-bg-shared-mobile-view]').forEach(function(view){
      var root=view.getAttribute('data-bg-mobile-view')==='root'||view.getAttribute('data-bg-shared-mobile-view')==='root';
      if (root) view.removeAttribute('hidden'); else view.setAttribute('hidden','');
    });
  }
  /* Keep the existing handlers; no second menu engine or duplicate close button. */
  function ensureCloseButtons() {
    MENUS.forEach(function(config) {
      var nav=document.getElementById(config.id);
      if(nav)nav.querySelectorAll('[data-bg-sitewide-close]').forEach(function(button){button.remove();});
    });
  }
  /* Fixed children under a filtered or transformed header can be offset on
     iOS. The public menu sheet must belong directly to the viewport. */
  function syncMenuGeometry() {
    if(!document.body)return;
    var mobile=window.matchMedia('(max-width:1100px)').matches;
    MENUS.forEach(function(config){
      var nav=document.getElementById(config.id);
      if(nav && nav.parentElement!==document.body && config.id!=='v18MobileDrawer')
        document.body.appendChild(nav);
    });
    // The original V18 drawer-state observer can rewrite aria-controls to an
    // offscreen 94vw sliding drawer after the visible drilldown has mounted.
    // Keep one real menu owner: the accessible, viewport-aligned bgMobileNav.
    var canonical=document.getElementById('bgMobileNav');
    var legacy=document.getElementById('v18MobileDrawer');
    var toggle=document.getElementById('mobileToggle');
    document.body.classList.toggle('bg-site-mobile-canonical-nav',Boolean(canonical)&&mobile);
    if(canonical && mobile && toggle){
      if(legacy && legacy.getAttribute('aria-hidden')!=='true')legacy.setAttribute('aria-hidden','true');
      if(legacy && legacy.classList.contains('open'))legacy.classList.remove('open');
      if(toggle.getAttribute('aria-controls')!=='bgMobileNav')toggle.setAttribute('aria-controls','bgMobileNav');
    }
    var open=activeMenu();
    document.body.classList.toggle('bg-site-mobile-menu-open',Boolean(open)&&mobile);
    var headers=document.querySelectorAll('header.v17-header,nav.bgkop');
    var header=Array.prototype.find.call(headers,function(node){return getComputedStyle(node).display!=='none';});
    if(header && mobile) {
      var height=Math.max(56,Math.min(window.innerHeight-80,Math.round(header.getBoundingClientRect().bottom)));
      document.documentElement.style.setProperty('--bg-site-menu-top',height+'px');
    }
  }
  function knowledgeCompare() {
    var frame=document.getElementById('compareFrame');
    var range=document.getElementById('compareRange');
    if (!frame || !range || frame.dataset.bgKnowledgeMounted==='1') return;
    frame.dataset.bgKnowledgeMounted='1';
    /* The homepage compare runtime must not create a second control here. */
    frame.setAttribute('data-bg-compare-version','native-range-v13');
    frame.querySelectorAll('.bg-compare-range').forEach(function(other){if(other!==range)other.remove();});
    range.min='0';range.max='100';range.step='1';
    range.setAttribute('aria-label','Schuif tussen verspreide en geborgde kennis');
    frame.appendChild(range);
    var label=document.querySelector('label[for="compareRange"]');
    var output=document.createElement('output');
    output.className='bg-knowledge-slider-output';
    output.setAttribute('for','compareRange');
    if (label) label.appendChild(output);
    function update() {
      var value=Math.max(0,Math.min(100,Number(range.value)||0));
      frame.dataset.bgKnowledgeSide=value<50?'before':'after';
      output.value=String(value)+'% geborgd';
      output.textContent=output.value;
      /* Keep the original page's range listener as the single render owner. */
    }
    range.addEventListener('input',update);
    range.addEventListener('change',update);
    range.dispatchEvent(new Event('input',{bubbles:true}));
    update();
  }
  function fixUnreadableButtons() {
    // Repair computed white-on-white controls, without changing intentionally
    // transparent controls on photographic or dark backgrounds.
    document.querySelectorAll('main a[href],main button:not(:disabled)').forEach(function(control) {
      if (!control.textContent || !control.textContent.trim()) return;
      var style=getComputedStyle(control);
      var bg=style.backgroundColor.match(/^rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([\d.]+))?/i);
      var fg=style.color.match(/^rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
      if (!bg || !fg) return;
      var alpha=bg[4]===undefined?1:Number(bg[4]);
      var lightBg=alpha>.95 && Number(bg[1])>238 && Number(bg[2])>238 && Number(bg[3])>238;
      var lightText=Number(fg[1])>220 && Number(fg[2])>220 && Number(fg[3])>220;
      if (lightBg && lightText) {
        control.style.setProperty('color','#14171a','important');
        control.setAttribute('data-bg-contrast-repaired','true');
      }
    });
  }
  function init() {
    if (!document.body) return;
    ensureCloseButtons();
    syncMenuGeometry();
    knowledgeCompare();
    fixUnreadableButtons();
  }
  document.addEventListener('click',function(event) {
    var close=event.target.closest && event.target.closest('[data-bg-sitewide-close]');
    var toggle=event.target.closest && event.target.closest('#mobileToggle,#bgkopKnop');
    var open=activeMenu();
    if (!open || (!close && !(toggle && toggle===open.toggle))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeMenu(open);
    if (toggle) toggle.focus();
  },true);
  document.addEventListener('keydown',function(event){
    if (event.key!=='Escape') return;
    var open=activeMenu();
    if (!open) return;
    closeMenu(open);
    if (open.toggle) open.toggle.focus();
  },true);
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  /* Dynamic CMS navigation can mount after DOMContentLoaded. */
  var scheduled=false;
  var observer=new MutationObserver(function(mutations){
    if (!mutations.some(function(m){return m.type==='childList' && m.addedNodes.length>0;})) return;
    if (scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;init();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  var stateObserver=new MutationObserver(function(changes){
    if(changes.some(function(m){return /^(bgMobileNav|bgSharedMobileNav|v18MobileDrawer)$/.test(m.target.id||'');}))
      syncMenuGeometry();
  });
  stateObserver.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['aria-hidden']});
  window.addEventListener('resize',syncMenuGeometry,{passive:true});
})();