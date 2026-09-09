(function(){
  'use strict';

  var SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
  var READY = 'data-bg-pointer-capture-v14';

  function clamp(raw){
    var value = Number(raw);
    if(!Number.isFinite(value)) value = 50;
    return Math.max(0, Math.min(100, value));
  }

  function collect(){
    var set = new Set(Array.prototype.slice.call(document.querySelectorAll(SLIDER_SELECTOR)));
    Array.prototype.slice.call(document.querySelectorAll('.compare-before')).forEach(function(before){
      var parent = before.parentElement;
      if(parent && parent.querySelector('.compare-after')) set.add(parent);
    });
    return Array.prototype.slice.call(set).filter(function(slider){
      return slider.querySelector('.compare-before') && slider.querySelector('.compare-after');
    });
  }

  function init(slider){
    if(!slider || slider.getAttribute(READY) === 'true') return;
    slider.setAttribute(READY,'true');
    slider.setAttribute('data-bg-compare-slider','');
    slider.setAttribute('data-bg-compare-ready','true');
    slider.style.setProperty('touch-action','pan-y','important');
    slider.style.setProperty('cursor','ew-resize','important');

    Array.prototype.slice.call(slider.querySelectorAll('.bg-compare-range')).forEach(function(range){ range.remove(); });

    var before = slider.querySelector('.compare-before');
    var after = slider.querySelector('.compare-after');
    var handle = slider.querySelector('.compare-handle');
    var knob = slider.querySelector('.compare-knob');
    var divider = slider.querySelector('.bg-compare-divider');

    if(!divider){
      divider = document.createElement('span');
      divider.className = 'bg-compare-divider';
      divider.setAttribute('aria-hidden','true');
      slider.appendChild(divider);
    }

    if(handle){
      handle.style.setProperty('display','block','important');
      handle.style.setProperty('position','absolute','important');
      handle.style.setProperty('z-index','22','important');
      handle.style.setProperty('pointer-events','none','important');
    }
    if(knob){
      knob.removeAttribute('aria-hidden');
      knob.setAttribute('role','slider');
      knob.setAttribute('aria-label','Vergelijk huidige en gewenste situatie');
      knob.setAttribute('aria-valuemin','0');
      knob.setAttribute('aria-valuemax','100');
      knob.setAttribute('aria-disabled','false');
      knob.tabIndex = 0;
      knob.style.setProperty('pointer-events','auto','important');
    }

    function syncReadableSide(value){
      var mobile = window.matchMedia && window.matchMedia('(max-width:720px)').matches;
      if(!mobile){ slider.removeAttribute('data-bg-readable-side'); return; }
      if(value <= 20) slider.setAttribute('data-bg-readable-side','after');
      else if(value >= 80) slider.setAttribute('data-bg-readable-side','before');
      else slider.removeAttribute('data-bg-readable-side');
    }

    function render(raw){
      var value = clamp(raw);
      if(value < .001) value = 0;
      if(value > 99.999) value = 100;
      var pct = value.toFixed(4) + '%';
      var endpoint = value === 0 ? 'start' : value === 100 ? 'end' : 'middle';
      slider.setAttribute('data-bg-compare-endpoint',endpoint);
      slider.setAttribute('data-bg-compare-value',value.toFixed(4));
      slider.style.setProperty('--bg-compare-split',pct);
      slider.style.setProperty('--split',pct);
      if(before) before.style.setProperty('clip-path','inset(0 ' + (100 - value).toFixed(4) + '% 0 0)','important');
      if(after) after.style.setProperty('clip-path','inset(0 0 0 ' + value.toFixed(4) + '%)','important');
      divider.style.setProperty('left',pct,'important');
      divider.style.setProperty('transform',endpoint === 'start' ? 'translateX(0)' : endpoint === 'end' ? 'translateX(-100%)' : 'translateX(-50%)','important');
      if(handle){
        handle.style.setProperty('left',pct,'important');
        handle.style.setProperty('transform',endpoint === 'start' ? 'translateX(0)' : endpoint === 'end' ? 'translateX(-100%)' : 'translateX(-50%)','important');
      }
      if(knob) knob.setAttribute('aria-valuenow',String(Math.round(value)));
      syncReadableSide(value);
      return value;
    }

    function initialValue(){
      var css = getComputedStyle(slider);
      var controlled = parseFloat(css.getPropertyValue('--bg-compare-split'));
      if(Number.isFinite(controlled)) return clamp(controlled);
      var legacy = parseFloat(css.getPropertyValue('--split'));
      return Number.isFinite(legacy) ? clamp(legacy) : 50;
    }

    function applyFromClientX(event){
      var rect = slider.getBoundingClientRect();
      if(!rect.width) return render(50);
      var x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      return render(x / rect.width * 100);
    }

    var activePointerId = null;
    function pointerdown(event){
      if(event.pointerType === 'mouse' && event.button !== 0) return;
      activePointerId = event.pointerId;
      try { slider.setPointerCapture(event.pointerId); } catch(_error) {}
      applyFromClientX(event);
    }
    function pointermove(event){
      if(activePointerId !== event.pointerId) return;
      applyFromClientX(event);
    }
    function finishPointer(event){
      if(activePointerId !== event.pointerId) return;
      applyFromClientX(event);
      try {
        if(slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      } catch(_error) {}
      activePointerId = null;
    }
    function pointercancel(event){
      if(activePointerId !== event.pointerId) return;
      try {
        if(slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
      } catch(_error) {}
      activePointerId = null;
    }

    slider.addEventListener('pointerdown',pointerdown);
    slider.addEventListener('pointermove',pointermove);
    slider.addEventListener('pointerup',finishPointer);
    slider.addEventListener('pointercancel',pointercancel);

    if(knob){
      knob.addEventListener('keydown',function(event){
        var current = clamp(parseFloat(slider.getAttribute('data-bg-compare-value')));
        var next = current;
        if(event.key === 'Home') next = 0;
        else if(event.key === 'End') next = 100;
        else if(event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - 2;
        else if(event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + 2;
        else return;
        event.preventDefault();
        render(next);
      });
    }

    render(initialValue());
  }

  function mount(){ collect().forEach(init); }
  mount();
  new MutationObserver(mount).observe(document.documentElement,{childList:true,subtree:true});
})();
