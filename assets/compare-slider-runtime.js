(function(){
  'use strict';

  var SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';
  var VERSION = 'full-endpoints-v4';
  var SNAP_THRESHOLD = 8;
  var CHANGE_TITLE = 'Eén wijziging. Overal doorgewerkt.';
  var CHANGE_STEPS = ['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'];

  function norm(v){ return String(v || '').replace(/\s+/g, ' ').trim(); }
  function allHeadings(root){ return Array.prototype.slice.call(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')); }
  function findHeading(root,label){ return allHeadings(root).find(function(h){ return norm(h.textContent) === label; }) || null; }
  function changeStepContainer(kop,section){
    var node = kop;
    while(node.parentElement && node.parentElement !== section){
      var parent = node.parentElement;
      var count = allHeadings(parent).filter(function(h){ return CHANGE_STEPS.indexOf(norm(h.textContent)) !== -1; }).length;
      if(count !== 1) break;
      node = parent;
    }
    return node;
  }
  function rgb(value){
    var m = String(value || '').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);
    return m ? [+m[1],+m[2],+m[3]] : null;
  }
  function green(value){
    var c = rgb(value);
    if(!c) return false;
    return (c[1] > c[0] + 24 && c[1] > c[2] + 10) || (c[1] > 95 && c[0] < 80 && c[2] < 120);
  }
  function explicitCheck(el){
    var sig = [el.className && el.className.baseVal || el.className, el.id, el.getAttribute && el.getAttribute('src'), el.getAttribute && el.getAttribute('aria-label'), el.getAttribute && el.getAttribute('title')].join(' ').toLowerCase();
    return /(check|tick|vink|complete|completed|done|success|status-ok)/.test(sig) || norm(el.textContent) === '✓';
  }
  function visualCheck(el){
    var r = el.getBoundingClientRect();
    if(r.width < 18 || r.width > 64 || r.height < 18 || r.height > 64) return false;
    var s = getComputedStyle(el);
    var p = el.parentElement ? getComputedStyle(el.parentElement) : null;
    return green(s.color) || green(s.backgroundColor) || (p && (green(p.color) || green(p.backgroundColor)));
  }
  function findCheck(row){
    var nodes = Array.prototype.slice.call(row.querySelectorAll('img,svg,span,i,div'));
    return nodes.find(explicitCheck) || nodes.find(visualCheck) || null;
  }
  function ensureFallback(row){
    if(row.querySelector('.bg-change-check-fallback')) return;
    var el = document.createElement('span');
    el.className = 'bg-change-check-fallback';
    el.setAttribute('aria-hidden','true');
    el.textContent = '✓';
    row.appendChild(el);
  }
  function ensureFourChangeChecks(){
    var title = findHeading(document, CHANGE_TITLE);
    if(!title) return;
    var section = title.closest('section') || title.parentElement;
    if(!section) return;
    var rows = CHANGE_STEPS.map(function(label){
      var h = findHeading(section,label);
      return h ? changeStepContainer(h,section) : null;
    });
    if(rows.some(function(row){ return !row; })) return;
    rows.forEach(function(row,index){
      row.setAttribute('data-bg-change-step', String(index + 1));
      var check = findCheck(row);
      if(check){
        check.setAttribute('data-bg-change-check-source','true');
        var old = row.querySelector('.bg-change-check-fallback');
        if(old) old.remove();
      } else {
        ensureFallback(row);
      }
    });
  }

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

  function takeCanonicalOwnership(slider){
    if(slider.getAttribute('data-bg-compare-owner') === 'canonical') return slider;
    var clone = slider.cloneNode(true);
    clone.setAttribute('data-bg-compare-owner','canonical');
    clone.removeAttribute('data-bg-compare-version');
    slider.replaceWith(clone);
    return clone;
  }

  function initSlider(slider){
    if(slider.getAttribute('data-bg-compare-version') === VERSION) return;
    slider.setAttribute('data-bg-compare-slider','');
    slider.setAttribute('data-bg-compare-ready','true');
    slider.setAttribute('data-bg-compare-version',VERSION);

    var beforeSide = slider.querySelector('.compare-before');
    var afterSide = slider.querySelector('.compare-after');
    var handle = slider.querySelector('.compare-handle');
    var knob = slider.querySelector('.compare-knob');
    var dragging = false;
    var touchDragging = false;

    function snap(raw){
      var value = Math.max(0, Math.min(100, Number(raw) || 0));
      return value <= SNAP_THRESHOLD ? 0 : value >= 100 - SNAP_THRESHOLD ? 100 : value;
    }
    function initialValue(){
      var css = getComputedStyle(slider);
      var controlled = parseFloat(css.getPropertyValue('--bg-compare-split'));
      if(Number.isFinite(controlled)) return snap(controlled);
      var legacy = parseFloat(css.getPropertyValue('--split'));
      return Number.isFinite(legacy) ? snap(legacy) : 50;
    }
    function readControlled(){
      var raw = parseFloat(slider.style.getPropertyValue('--bg-compare-split'));
      return Number.isFinite(raw) ? raw : initialValue();
    }
    function syncAria(value){
      if(!knob) return;
      value = Number.isFinite(value) ? value : readControlled();
      knob.setAttribute('aria-valuemin','0');
      knob.setAttribute('aria-valuemax','100');
      knob.setAttribute('aria-valuenow', value.toFixed(0));
      knob.setAttribute('aria-disabled','false');
      knob.tabIndex = 0;
    }
    function renderControlled(raw){
      var value = snap(raw);
      var pct = value.toFixed(2) + '%';
      slider.style.setProperty('--bg-compare-split', pct);
      slider.style.setProperty('--split', pct);
      if(beforeSide) beforeSide.style.setProperty('clip-path', 'inset(0 ' + (100 - value).toFixed(2) + '% 0 0)', 'important');
      if(afterSide) afterSide.style.setProperty('clip-path', 'inset(0 0 0 ' + value.toFixed(2) + '%)', 'important');
      if(handle) handle.style.setProperty('left', pct, 'important');
      syncAria(value);
      return value;
    }
    function applyFromClientX(clientX){
      var r = slider.getBoundingClientRect();
      if(!r.width) return renderControlled(50);
      return renderControlled(((clientX - r.left) / r.width) * 100);
    }
    function current(){ return readControlled(); }

    slider.addEventListener('pointerdown',function(e){
      dragging = true;
      if(slider.setPointerCapture) try{ slider.setPointerCapture(e.pointerId); }catch(_e){}
      applyFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    slider.addEventListener('pointermove',function(e){
      if(!dragging) return;
      applyFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    slider.addEventListener('pointerup',function(e){
      if(!dragging) return;
      dragging = false;
      applyFromClientX(e.clientX);
      if(slider.releasePointerCapture) try{ slider.releasePointerCapture(e.pointerId); }catch(_e){}
      e.stopImmediatePropagation();
    },true);
    slider.addEventListener('pointercancel',function(){ dragging = false; },true);

    slider.addEventListener('touchstart',function(e){
      if(!e.touches || !e.touches[0]) return;
      touchDragging = true;
      applyFromClientX(e.touches[0].clientX);
      e.stopImmediatePropagation();
    },{capture:true,passive:true});
    document.addEventListener('touchmove',function(e){
      if(!touchDragging || !e.touches || !e.touches[0]) return;
      applyFromClientX(e.touches[0].clientX);
    },{capture:true,passive:true});
    document.addEventListener('touchend',function(e){
      if(!touchDragging) return;
      touchDragging = false;
      var point = e.changedTouches && e.changedTouches[0];
      if(point) applyFromClientX(point.clientX);
    },{capture:true,passive:true});
    document.addEventListener('touchcancel',function(){ touchDragging = false; },{capture:true,passive:true});

    if(knob){
      knob.addEventListener('keydown',function(e){
        var value = current();
        if(e.key === 'ArrowLeft') value -= 5;
        else if(e.key === 'ArrowRight') value += 5;
        else if(e.key === 'Home') value = 0;
        else if(e.key === 'End') value = 100;
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        renderControlled(value);
      },true);
    }

    renderControlled(initialValue());
  }

  function ensureSliders(){
    collectSliders().forEach(function(slider){
      initSlider(takeCanonicalOwnership(slider));
    });
  }

  ensureFourChangeChecks();
  ensureSliders();
  new MutationObserver(function(){ ensureFourChangeChecks(); ensureSliders(); }).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('resize',function(){ ensureFourChangeChecks(); ensureSliders(); },{passive:true});
})();
