(function(){
  'use strict';

  var SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
  var POINTER_VERSION = 'pointer-full-edges-v1';
  var LEGACY_VERSION = 'full-endpoints-v7-responsive-flow';
  var SNAP_THRESHOLD = 8;
  var STALE_RANGE_SELECTOR = '.' + ['bg','compare','range'].join('-');

  function collectSliders(){
    var set = new Set(Array.prototype.slice.call(document.querySelectorAll(SLIDER_SELECTOR)));
    Array.prototype.slice.call(document.querySelectorAll('.compare-before')).forEach(function(before){
      var parent = before.parentElement;
      if(parent && parent.querySelector('.compare-after')) set.add(parent);
    });
    return Array.prototype.slice.call(set).filter(function(slider){
      return slider.querySelector('.compare-before') && slider.querySelector('.compare-after');
    });
  }

  function snap(raw){
    var value = Math.max(0, Math.min(100, Number(raw) || 0));
    return value <= SNAP_THRESHOLD ? 0 : value >= 100 - SNAP_THRESHOLD ? 100 : value;
  }

  function initialValue(slider){
    var css = getComputedStyle(slider);
    var controlled = parseFloat(css.getPropertyValue('--bg-compare-split'));
    if(Number.isFinite(controlled)) return snap(controlled);
    var legacy = parseFloat(css.getPropertyValue('--split'));
    return Number.isFinite(legacy) ? snap(legacy) : 50;
  }

  function takePointerOwnership(slider){
    if(slider.getAttribute('data-bg-pointer-slider-version') === POINTER_VERSION) return slider;
    var clone = slider.cloneNode(true);
    clone.querySelectorAll(STALE_RANGE_SELECTOR).forEach(function(node){ node.remove(); });
    clone.setAttribute('data-bg-compare-slider','');
    clone.setAttribute('data-bg-compare-ready','true');
    clone.setAttribute('data-bg-compare-owner','canonical');
    // Keep the legacy runtime from re-attaching its old pointer/touch listeners.
    clone.setAttribute('data-bg-compare-version',LEGACY_VERSION);
    clone.setAttribute('data-bg-pointer-slider-version',POINTER_VERSION);
    clone.removeAttribute('data-bg-native-range-ready');
    clone.removeAttribute('data-bg-fallback-ready');
    slider.replaceWith(clone);
    return clone;
  }

  function initSlider(slider){
    if(slider.getAttribute('data-bg-pointer-slider-ready') === 'true') return;
    slider.setAttribute('data-bg-pointer-slider-ready','true');

    var beforeSide = slider.querySelector('.compare-before');
    var afterSide = slider.querySelector('.compare-after');
    var handle = slider.querySelector('.compare-handle');
    var knob = slider.querySelector('.compare-knob');
    var activePointer = null;

    function readControlled(){
      var raw = parseFloat(slider.style.getPropertyValue('--bg-compare-split'));
      return Number.isFinite(raw) ? raw : initialValue(slider);
    }

    function syncAria(value){
      if(!knob) return;
      knob.setAttribute('role','slider');
      knob.setAttribute('aria-valuemin','0');
      knob.setAttribute('aria-valuemax','100');
      knob.setAttribute('aria-valuenow',String(Math.round(value)));
      knob.setAttribute('aria-disabled','false');
      if(knob.tabIndex < 0) knob.tabIndex = 0;
    }

    function render(raw){
      var value = snap(raw);
      var pct = value.toFixed(2) + '%';
      slider.style.setProperty('--split',pct);
      slider.style.setProperty('--bg-compare-split',pct);
      slider.setAttribute('data-bg-readable-side',value >= 50 ? 'before' : 'after');
      if(beforeSide) beforeSide.style.setProperty('clip-path','inset(0 ' + (100 - value).toFixed(2) + '% 0 0)','important');
      if(afterSide) afterSide.style.setProperty('clip-path','inset(0 0 0 ' + value.toFixed(2) + '%)','important');
      if(handle) handle.style.setProperty('left',pct,'important');
      syncAria(value);
      return value;
    }

    function applyFromClientX(clientX){
      var r = slider.getBoundingClientRect();
      if(!r.width) return render(50);
      var x = Math.max(0, Math.min(r.width, clientX - r.left));
      return render((x / r.width) * 100);
    }

    slider.addEventListener('pointerdown',function(e){
      if(e.isPrimary === false) return;
      activePointer = e.pointerId;
      if(slider.setPointerCapture){
        try{ slider.setPointerCapture(e.pointerId); }catch(_e){}
      }
      applyFromClientX(e.clientX);
      e.stopImmediatePropagation();
    },true);

    slider.addEventListener('pointermove',function(e){
      if(activePointer !== e.pointerId) return;
      applyFromClientX(e.clientX);
      e.stopImmediatePropagation();
    },true);

    function finishPointer(e){
      if(activePointer !== e.pointerId) return;
      applyFromClientX(e.clientX);
      if(slider.releasePointerCapture){
        try{ slider.releasePointerCapture(e.pointerId); }catch(_e){}
      }
      activePointer = null;
      e.stopImmediatePropagation();
    }

    slider.addEventListener('pointerup',finishPointer,true);
    slider.addEventListener('pointercancel',function(e){
      if(activePointer === e.pointerId) activePointer = null;
    },true);

    if(knob){
      knob.addEventListener('keydown',function(e){
        var value = readControlled();
        if(e.key === 'ArrowLeft') value -= 5;
        else if(e.key === 'ArrowRight') value += 5;
        else if(e.key === 'Home') value = 0;
        else if(e.key === 'End') value = 100;
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        render(value);
      },true);
    }

    render(initialValue(slider));
  }

  function ensureSliders(){
    collectSliders().forEach(function(slider){ initSlider(takePointerOwnership(slider)); });
  }

  ensureSliders();
  new MutationObserver(ensureSliders).observe(document.documentElement,{childList:true,subtree:true});
})();
