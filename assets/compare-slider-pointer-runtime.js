(function(){
  'use strict';

  var SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
  var POINTER_VERSION = 'pointer-capture-v8';
  var LEGACY_VERSION = 'full-endpoints-v7-responsive-flow';
  var SNAP_THRESHOLD = 8;

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

  function own(slider){
    if(slider.__bgPointerOwner === POINTER_VERSION) return slider;
    var clone = slider.cloneNode(true);
    clone.querySelectorAll('.bg-compare-range').forEach(function(node){ node.remove(); });
    clone.setAttribute('data-bg-compare-slider','');
    clone.setAttribute('data-bg-compare-ready','true');
    clone.setAttribute('data-bg-compare-owner','canonical');
    clone.setAttribute('data-bg-compare-version', LEGACY_VERSION);
    clone.setAttribute('data-bg-pointer-owner', POINTER_VERSION);
    clone.removeAttribute('data-bg-native-range-ready');
    slider.replaceWith(clone);
    return clone;
  }

  function initSlider(slider){
    if(slider.__bgPointerOwner === POINTER_VERSION) return;
    slider.__bgPointerOwner = POINTER_VERSION;

    var beforeSide = slider.querySelector('.compare-before');
    var afterSide = slider.querySelector('.compare-after');
    var handle = slider.querySelector('.compare-handle');
    var knob = slider.querySelector('.compare-knob');
    var dragging = false;
    var activePointerId = null;

    function initialValue(){
      var css = getComputedStyle(slider);
      var controlled = parseFloat(css.getPropertyValue('--bg-compare-split'));
      if(Number.isFinite(controlled)) return snap(controlled);
      var legacy = parseFloat(css.getPropertyValue('--split'));
      return Number.isFinite(legacy) ? snap(legacy) : 50;
    }

    function current(){
      var raw = parseFloat(slider.style.getPropertyValue('--bg-compare-split'));
      return Number.isFinite(raw) ? raw : initialValue();
    }

    function render(raw){
      var value = snap(raw);
      var pct = value.toFixed(2) + '%';
      slider.style.setProperty('--bg-compare-split', pct);
      slider.style.setProperty('--split', pct);
      slider.setAttribute('data-bg-readable-side', value >= 50 ? 'before' : 'after');
      if(beforeSide) beforeSide.style.setProperty('clip-path', 'inset(0 ' + (100 - value).toFixed(2) + '% 0 0)', 'important');
      if(afterSide) afterSide.style.setProperty('clip-path', 'inset(0 0 0 ' + value.toFixed(2) + '%)', 'important');
      if(handle) handle.style.setProperty('left', pct, 'important');
      if(knob){
        knob.setAttribute('aria-valuemin','0');
        knob.setAttribute('aria-valuemax','100');
        knob.setAttribute('aria-valuenow', String(Math.round(value)));
        knob.setAttribute('aria-disabled','false');
        knob.tabIndex = 0;
      }
      return value;
    }

    function applyFromClientX(clientX){
      var r = slider.getBoundingClientRect();
      if(!r.width) return render(50);
      var x = Math.max(0, Math.min(r.width, clientX - r.left));
      return render((x / r.width) * 100);
    }

    slider.addEventListener('pointerdown', function(e){
      if(e.isPrimary === false) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      activePointerId = e.pointerId;
      if(slider.setPointerCapture){
        try { slider.setPointerCapture(e.pointerId); } catch(_e) {}
      }
      applyFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    slider.addEventListener('pointermove', function(e){
      if(!dragging || e.pointerId !== activePointerId) return;
      applyFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    function finish(e){
      if(!dragging || (e && e.pointerId !== activePointerId)) return;
      if(e && Number.isFinite(e.clientX)) applyFromClientX(e.clientX);
      var pointerId = activePointerId;
      dragging = false;
      activePointerId = null;
      if(pointerId !== null && slider.releasePointerCapture){
        try { slider.releasePointerCapture(pointerId); } catch(_e) {}
      }
      if(e) e.stopImmediatePropagation();
    }

    slider.addEventListener('pointerup', finish, true);
    slider.addEventListener('pointercancel', finish, true);
    slider.addEventListener('lostpointercapture', function(){ dragging = false; activePointerId = null; }, true);

    if(knob){
      knob.addEventListener('keydown', function(e){
        var value = current();
        if(e.key === 'ArrowLeft') value -= 5;
        else if(e.key === 'ArrowRight') value += 5;
        else if(e.key === 'Home') value = 0;
        else if(e.key === 'End') value = 100;
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        render(value);
      }, true);
    }

    render(initialValue());
  }

  function ensureSliders(){
    collectSliders().forEach(function(slider){
      initSlider(own(slider));
    });
  }

  ensureSliders();
  new MutationObserver(ensureSliders).observe(document.documentElement, { childList:true, subtree:true });
})();
