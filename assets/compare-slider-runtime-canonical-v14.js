(function(){
  'use strict';

  var SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider],[data-bg-compare-slider]';
  var VERSION = 'canonical-v14';
  var OWNER_ATTR = 'data-bg-compare-owner';
  var READY_ATTR = 'data-bg-compare-ready';
  var ADAPTER_ATTR = 'data-bg-compare-adapter';
  var VALUE_ATTR = 'data-bg-compare-value';
  var ACTIVE = new WeakMap();

  function clamp(raw){
    var value = Number(raw);
    if(!Number.isFinite(value)) value = 50;
    return Math.max(0, Math.min(100, value));
  }

  function clientXToValue(slider, clientX){
    var rect = slider.getBoundingClientRect();
    if(!rect.width) return 0;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }

  function collectSliders(){
    var set = new Set(Array.prototype.slice.call(document.querySelectorAll(SLIDER_SELECTOR)));
    Array.prototype.slice.call(document.querySelectorAll('.compare-before')).forEach(function(before){
      var parent = before.parentElement;
      if(parent && parent.querySelector('.compare-after')) set.add(parent);
    });
    return Array.prototype.slice.call(set).filter(function(slider){
      return slider && slider.querySelector('.compare-before') && slider.querySelector('.compare-after');
    });
  }

  function ensureDivider(slider){
    var divider = slider.querySelector('.bg-compare-divider');
    if(!divider){
      divider = document.createElement('span');
      divider.className = 'bg-compare-divider';
      divider.setAttribute('aria-hidden','true');
      slider.appendChild(divider);
    }
    divider.setAttribute('aria-hidden','true');
    divider.style.setProperty('position','absolute','important');
    divider.style.setProperty('top','0','important');
    divider.style.setProperty('bottom','0','important');
    divider.style.setProperty('width','4px','important');
    divider.style.setProperty('background','#FFE86B','important');
    divider.style.setProperty('z-index','21','important');
    divider.style.setProperty('pointer-events','none','important');
    return divider;
  }

  function ensureKnob(slider){
    var knob = slider.querySelector('.bg-compare-knob');
    if(!knob){
      knob = document.createElement('span');
      knob.className = 'bg-compare-knob';
      knob.setAttribute('aria-hidden','true');
      slider.appendChild(knob);
    }
    knob.setAttribute('aria-hidden','true');
    knob.tabIndex = -1;
    knob.style.setProperty('position','absolute','important');
    knob.style.setProperty('top','50%','important');
    knob.style.setProperty('width','44px','important');
    knob.style.setProperty('height','44px','important');
    knob.style.setProperty('border-radius','999px','important');
    knob.style.setProperty('background','#fff','important');
    knob.style.setProperty('border','3px solid #FFE86B','important');
    knob.style.setProperty('box-shadow','0 4px 18px rgba(0,0,0,.20)','important');
    knob.style.setProperty('z-index','22','important');
    knob.style.setProperty('pointer-events','none','important');
    return knob;
  }

  function initialValue(slider){
    var raw = slider.getAttribute(VALUE_ATTR);
    if(raw !== null && raw !== '') return clamp(raw);
    var css = getComputedStyle(slider);
    var controlled = parseFloat(css.getPropertyValue('--bg-compare-split'));
    if(Number.isFinite(controlled)) return clamp(controlled);
    var legacy = parseFloat(css.getPropertyValue('--split'));
    return Number.isFinite(legacy) ? clamp(legacy) : 50;
  }

  function syncReadableSide(slider, value){
    var mobile = window.matchMedia && window.matchMedia('(max-width:720px)').matches;
    if(!mobile){
      slider.removeAttribute('data-bg-readable-side');
      return;
    }
    if(value <= 20) slider.setAttribute('data-bg-readable-side','after');
    else if(value >= 80) slider.setAttribute('data-bg-readable-side','before');
    else slider.removeAttribute('data-bg-readable-side');
  }

  function render(state, raw){
    var slider = state.slider;
    var value = clamp(raw);
    var pct = value.toFixed(4) + '%';
    var endpoint = value === 0 ? 'start' : value === 100 ? 'end' : 'middle';

    state.value = value;
    slider.setAttribute(VALUE_ATTR, value.toFixed(4));
    slider.setAttribute('data-bg-compare-endpoint', endpoint);
    slider.setAttribute('aria-valuenow', String(Math.round(value)));
    slider.style.setProperty('--bg-compare-split', pct);
    slider.style.setProperty('--split', pct);

    state.before.style.setProperty('clip-path', 'inset(0 ' + (100 - value).toFixed(4) + '% 0 0)', 'important');
    state.after.style.setProperty('clip-path', 'inset(0 0 0 ' + value.toFixed(4) + '%)', 'important');

    state.divider.style.setProperty('left', pct, 'important');
    state.divider.style.setProperty('transform', endpoint === 'start' ? 'translateX(0)' : endpoint === 'end' ? 'translateX(-100%)' : 'translateX(-50%)', 'important');

    state.knob.style.setProperty('left', pct, 'important');
    state.knob.style.setProperty('transform', 'translate(-50%,-50%)', 'important');

    syncReadableSide(slider, value);
    return value;
  }

  function applyClientX(state, clientX){
    return render(state, clientXToValue(state.slider, clientX));
  }

  function bindPointerEvents(state){
    var slider = state.slider;
    var pointerId = null;

    function down(event){
      if(event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      slider.focus({preventScroll:true});
      applyClientX(state, event.clientX);
      if(slider.setPointerCapture){
        try{ slider.setPointerCapture(pointerId); }catch(_error){}
      }
      event.preventDefault();
    }

    function move(event){
      if(pointerId === null || event.pointerId !== pointerId) return;
      applyClientX(state, event.clientX);
      event.preventDefault();
    }

    function end(event){
      if(pointerId === null || event.pointerId !== pointerId) return;
      applyClientX(state, event.clientX);
      if(slider.releasePointerCapture){
        try{ slider.releasePointerCapture(pointerId); }catch(_error){}
      }
      pointerId = null;
      event.preventDefault();
    }

    function cancel(event){
      if(pointerId === null || event.pointerId !== pointerId) return;
      if(slider.releasePointerCapture){
        try{ slider.releasePointerCapture(pointerId); }catch(_error){}
      }
      pointerId = null;
    }

    slider.addEventListener('pointerdown', down, {passive:false});
    slider.addEventListener('pointermove', move, {passive:false});
    slider.addEventListener('pointerup', end, {passive:false});
    slider.addEventListener('pointercancel', cancel, {passive:false});
  }

  function bindLegacyFallback(state){
    var slider = state.slider;
    var touching = false;
    var mouseDown = false;

    function firstTouch(event){ return event.touches && event.touches[0] || event.changedTouches && event.changedTouches[0]; }
    function touchStart(event){
      var touch = firstTouch(event);
      if(!touch) return;
      touching = true;
      slider.focus({preventScroll:true});
      applyClientX(state, touch.clientX);
      event.preventDefault();
    }
    function touchMove(event){
      if(!touching) return;
      var touch = firstTouch(event);
      if(!touch) return;
      applyClientX(state, touch.clientX);
      event.preventDefault();
    }
    function touchEnd(event){
      if(!touching) return;
      var touch = firstTouch(event);
      if(touch) applyClientX(state, touch.clientX);
      touching = false;
      event.preventDefault();
    }
    function mouseStart(event){
      if(event.button !== 0) return;
      mouseDown = true;
      slider.focus({preventScroll:true});
      applyClientX(state, event.clientX);
      event.preventDefault();
    }
    function mouseMove(event){ if(mouseDown) applyClientX(state, event.clientX); }
    function mouseEnd(event){
      if(!mouseDown) return;
      applyClientX(state, event.clientX);
      mouseDown = false;
    }

    slider.addEventListener('touchstart', touchStart, {passive:false});
    slider.addEventListener('touchmove', touchMove, {passive:false});
    slider.addEventListener('touchend', touchEnd, {passive:false});
    slider.addEventListener('touchcancel', function(){ touching = false; }, {passive:true});
    slider.addEventListener('mousedown', mouseStart);
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', mouseEnd);
  }

  function bindKeyboard(state){
    state.slider.addEventListener('keydown', function(event){
      var value = state.value;
      var handled = true;
      if(event.key === 'Home') value = 0;
      else if(event.key === 'End') value = 100;
      else if(event.key === 'ArrowLeft' || event.key === 'ArrowDown') value -= 1;
      else if(event.key === 'ArrowRight' || event.key === 'ArrowUp') value += 1;
      else if(event.key === 'PageDown') value -= 10;
      else if(event.key === 'PageUp') value += 10;
      else handled = false;
      if(!handled) return;
      render(state, value);
      event.preventDefault();
    });
  }

  function initSlider(slider){
    if(ACTIVE.has(slider) || slider.getAttribute(OWNER_ATTR) === VERSION) return;
    var before = slider.querySelector('.compare-before');
    var after = slider.querySelector('.compare-after');
    if(!before || !after) return;

    slider.setAttribute('data-bg-compare-slider','');
    slider.setAttribute(READY_ATTR,'true');
    slider.setAttribute(OWNER_ATTR, VERSION);
    slider.setAttribute('data-bg-compare-version', VERSION);
    slider.setAttribute(ADAPTER_ATTR,'before-after-clip');
    slider.removeAttribute('data-bg-pointer-owner-ready');
    slider.removeAttribute('data-bg-pointer-listeners');
    slider.setAttribute('role','slider');
    slider.setAttribute('aria-label', slider.getAttribute('aria-label') || 'Vergelijk huidige en gewenste situatie');
    slider.setAttribute('aria-valuemin','0');
    slider.setAttribute('aria-valuemax','100');
    slider.setAttribute('aria-orientation','horizontal');
    slider.tabIndex = 0;
    slider.style.setProperty('touch-action','pan-y','important');
    slider.style.setProperty('user-select','none','important');
    slider.style.setProperty('-webkit-user-select','none','important');

    var legacyRange = slider.querySelector('.bg-compare-range');
    if(legacyRange) legacyRange.remove();
    var legacyHandle = slider.querySelector('.compare-handle');
    if(legacyHandle){
      legacyHandle.setAttribute('aria-hidden','true');
      legacyHandle.tabIndex = -1;
      legacyHandle.style.setProperty('pointer-events','none','important');
    }
    var legacyKnob = slider.querySelector('.compare-knob');
    if(legacyKnob){
      legacyKnob.setAttribute('aria-hidden','true');
      legacyKnob.tabIndex = -1;
      legacyKnob.style.setProperty('pointer-events','none','important');
    }

    var state = {
      slider: slider,
      before: before,
      after: after,
      divider: ensureDivider(slider),
      knob: ensureKnob(slider),
      value: 50
    };
    ACTIVE.set(slider, state);

    bindKeyboard(state);
    if(window.PointerEvent) bindPointerEvents(state);
    else bindLegacyFallback(state);
    render(state, initialValue(slider));
  }

  function ensureSliders(){ collectSliders().forEach(initSlider); }

  ensureSliders();
  new MutationObserver(ensureSliders).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize', function(){
    collectSliders().forEach(function(slider){
      var state = ACTIVE.get(slider);
      if(state) render(state, state.value);
    });
  }, {passive:true});
  window.addEventListener('orientationchange', function(){
    collectSliders().forEach(function(slider){
      var state = ACTIVE.get(slider);
      if(state) render(state, state.value);
    });
  }, {passive:true});
})();
