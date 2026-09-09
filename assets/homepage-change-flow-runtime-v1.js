(function(){
  'use strict';

  var CHANGE_TITLE = 'Eén wijziging. Overal doorgewerkt.';
  var CHANGE_STEPS = ['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'];
  var IMPACT_LABELS = ['Processen','Rollen','Documenten','KPI’s','Acties'];
  var CHANGE_PROGRESS_MARKER = 'data-bg-change-progress';

  function norm(v){ return String(v || '').replace(/\s+/g, ' ').trim(); }
  function allHeadings(root){ return Array.prototype.slice.call(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')); }
  function findHeading(root,label){ return allHeadings(root).find(function(h){ return norm(h.textContent) === label; }) || null; }
  function findChangeLabel(root,label){
    var heading = findHeading(root,label);
    if(heading) return heading;
    var nodes = Array.prototype.slice.call(root.querySelectorAll('strong,b,span,p,[role="heading"]'));
    var exact = nodes.find(function(el){ return norm(el.textContent) === label; });
    if(exact) return exact;
    var prefix = nodes.filter(function(el){ return norm(el.textContent).indexOf(label) === 0; });
    prefix.sort(function(a,b){ return norm(a.textContent).length - norm(b.textContent).length; });
    return prefix[0] || null;
  }
  function changeStepContainer(kop,section){
    var node = kop;
    while(node.parentElement && node.parentElement !== section){
      var parent = node.parentElement;
      var text = norm(parent.textContent);
      var count = CHANGE_STEPS.filter(function(label){ return text.indexOf(label) !== -1; }).length;
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
  function ensureStepLayout(row){
    var existingRail = row.querySelector(':scope > .bg-change-step-rail');
    var existingContent = row.querySelector(':scope > .bg-change-step-content');
    if(existingRail && existingContent) return { rail: existingRail, content: existingContent, check: existingRail.querySelector('.bg-change-flow-check') };

    var source = findCheck(row);
    if(source) source.setAttribute('data-bg-change-check-source','true');

    var rail = document.createElement('span');
    rail.className = 'bg-change-step-rail';
    rail.setAttribute('aria-hidden','true');
    rail.setAttribute(CHANGE_PROGRESS_MARKER,'');

    var check = document.createElement('span');
    check.className = 'bg-change-flow-check';
    check.textContent = '✓';
    rail.appendChild(check);

    var fill = document.createElement('span');
    fill.className = 'bg-change-step-fill';
    rail.appendChild(fill);

    var content = document.createElement('div');
    content.className = 'bg-change-step-content';
    while(row.firstChild) content.appendChild(row.firstChild);

    row.appendChild(rail);
    row.appendChild(content);
    return { rail: rail, content: content, check: check };
  }
  function ensureImpact(content){
    if(content.querySelector('.bg-change-impact')) return;
    var impact = document.createElement('div');
    impact.className = 'bg-change-impact';
    impact.setAttribute('aria-label','Geraakte context: ' + IMPACT_LABELS.join(', '));
    IMPACT_LABELS.forEach(function(label,index){
      var pill = document.createElement('span');
      pill.textContent = label;
      impact.appendChild(pill);
      if(index < IMPACT_LABELS.length - 1){
        var arrow = document.createElement('i');
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden','true');
        impact.appendChild(arrow);
      }
    });
    content.appendChild(impact);
  }
  function connectLeakYield(section){
    var leak = document.querySelector('.bgx-lek');
    if(!leak || leak.getAttribute('data-bg-change-flow-yield-ready') === 'true') return;
    leak.setAttribute('data-bg-change-flow-yield-ready','true');
    function setYield(inFlow){ leak.classList.toggle('bgx-lek-uit-flow', !!inFlow); }
    if('IntersectionObserver' in window){
      var observer = new IntersectionObserver(function(entries){
        var visible = entries.some(function(entry){ return entry.isIntersecting && entry.intersectionRatio > 0; });
        setYield(visible);
      },{root:null,threshold:[0,.01,.25]});
      observer.observe(section);
    } else {
      function measure(){
        var r = section.getBoundingClientRect();
        setYield(r.bottom > 0 && r.top < window.innerHeight);
      }
      window.addEventListener('scroll',measure,{passive:true});
      window.addEventListener('resize',measure,{passive:true});
      measure();
    }
  }

  function initChangeFlow(){
    var title = findHeading(document, CHANGE_TITLE);
    if(!title) return;
    var section = title.closest('section') || title.parentElement;
    if(!section) return;
    var rows = CHANGE_STEPS.map(function(label){
      var h = findChangeLabel(section,label);
      return h ? changeStepContainer(h,section) : null;
    });
    if(rows.some(function(row){ return !row; })) return;

    section.setAttribute('data-bg-change-flow','');
    connectLeakYield(section);
    var layouts = rows.map(function(row,index){
      row.setAttribute('data-bg-change-step', String(index + 1));
      if(!row.hasAttribute('data-bg-change-status')) row.setAttribute('data-bg-change-status', index === 0 ? 'done' : index === 1 ? 'active' : 'future');
      return ensureStepLayout(row);
    });
    ensureImpact(layouts[1].content);

    if(section.getAttribute('data-bg-change-flow-ready') === 'true') return;
    section.setAttribute('data-bg-change-flow-ready','true');

    var maxProgress = 0;
    var raf = 0;
    function layout(){
      var rect = section.getBoundingClientRect();
      if(rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      var centers = rows.map(function(row){
        var r = row.getBoundingClientRect();
        return r.top + Math.min(34, Math.max(20, r.height * .12));
      });
      var first = centers[0];
      var last = centers[centers.length - 1];
      var trigger = window.innerHeight * .58;
      var current = Math.max(0, Math.min(1, (trigger - first) / Math.max(1,last - first)));
      maxProgress = Math.max(maxProgress,current);
      section.style.setProperty('--bg-change-progress', maxProgress.toFixed(4));

      var active = -1;
      rows.forEach(function(row,index){
        var threshold = index / (rows.length - 1);
        var done = maxProgress + .015 >= threshold;
        var nextThreshold = index === rows.length - 1 ? 1 : (index + 1) / (rows.length - 1);
        var segment = index === rows.length - 1 ? 1 : Math.max(0, Math.min(1, (maxProgress - threshold) / Math.max(.0001,nextThreshold - threshold)));
        row.style.setProperty('--bg-step-progress', segment.toFixed(4));
        if(done){
          row.setAttribute('data-bg-change-status','done');
          row.removeAttribute('aria-current');
        } else if(active === -1){
          active = index;
          row.setAttribute('data-bg-change-status','active');
          row.setAttribute('aria-current','step');
        } else {
          row.setAttribute('data-bg-change-status','future');
          row.removeAttribute('aria-current');
        }
      });
      if(active === -1) rows.forEach(function(row){ row.removeAttribute('aria-current'); });
    }
    function schedule(){
      if(raf) return;
      raf = requestAnimationFrame(function(){ raf = 0; layout(); });
    }
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('orientationchange',schedule,{passive:true});
    if(window.ResizeObserver){
      var ro = new ResizeObserver(schedule);
      ro.observe(section);
      rows.forEach(function(row){ ro.observe(row); });
    }
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(schedule).catch(function(){});
    schedule();
  }

  initChangeFlow();
  new MutationObserver(initChangeFlow).observe(document.documentElement,{childList:true,subtree:true});
})();
