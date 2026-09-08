const MARKER = 'data-bg-context-slider-readable';
const SLIDER_SELECTOR = '#compareSlider,.compare-slider,[data-compare-slider]';

const STYLE = `<style ${MARKER}>
[data-bg-compare-slider]{--split:50%;position:relative!important;overflow:hidden!important;touch-action:pan-y}
[data-bg-compare-slider] .compare-side{position:absolute!important;inset:0!important;width:100%!important;max-width:none!important}
[data-bg-compare-slider] .compare-before{clip-path:inset(0 calc(100% - var(--split,50%)) 0 0)!important}
[data-bg-compare-slider] .compare-after{clip-path:inset(0 0 0 var(--split,50%))!important}
[data-bg-compare-slider] .compare-before .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:0!important;margin-right:auto!important;padding-right:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-after .compare-copy{width:min(460px,calc(100% - 44px))!important;max-width:none!important;margin-left:auto!important;margin-right:0!important;padding-left:24px!important;box-sizing:border-box}
[data-bg-compare-slider] .compare-handle{display:block!important;position:absolute!important;left:var(--split,50%)!important;z-index:20!important}
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

const RUNTIME = `<script ${MARKER}>
(function(){
  var SLIDER_SELECTOR = ${JSON.stringify(SLIDER_SELECTOR)};
  var CHANGE_TITLE='Eén wijziging. Overal doorgewerkt.';
  var CHANGE_STEPS=['Signaal komt binnen','Context wordt begrepen','Opvolging ontstaat','Waarde wordt gemeten'];
  var IMPACT_LABELS=['Processen','Rollen','Documenten','KPI’s','Acties'];

  function norm(v){return String(v||'').replace(/\\s+/g,' ').trim();}
  function allHeadings(root){return [].slice.call(root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]'));}
  function findHeading(root,label){return allHeadings(root).find(function(h){return norm(h.textContent)===label;})||null;}
  function findChangeLabel(root,label){
    var heading=findHeading(root,label);if(heading)return heading;
    var nodes=[].slice.call(root.querySelectorAll('strong,b,span,p,[role="heading"]'));
    var exact=nodes.find(function(el){return norm(el.textContent)===label;});
    if(exact)return exact;
    var prefix=nodes.filter(function(el){return norm(el.textContent).indexOf(label)===0;});
    prefix.sort(function(a,b){return norm(a.textContent).length-norm(b.textContent).length;});
    return prefix[0]||null;
  }
  function changeStepContainer(kop,section){
    var node=kop;
    while(node.parentElement&&node.parentElement!==section){
      var parent=node.parentElement;
      var text=norm(parent.textContent);
      var count=CHANGE_STEPS.filter(function(label){return text.indexOf(label)!==-1;}).length;
      if(count!==1)break;
      node=parent;
    }
    return node;
  }
  function rgb(value){
    var m=String(value||'').match(/rgba?\\((\\d+)[, ]+(\\d+)[, ]+(\\d+)/i);
    return m?[+m[1],+m[2],+m[3]]:null;
  }
  function green(value){
    var c=rgb(value);if(!c)return false;
    return (c[1]>c[0]+24&&c[1]>c[2]+10)||(c[1]>95&&c[0]<80&&c[2]<120);
  }
  function explicitCheck(el){
    var sig=[el.className&&el.className.baseVal||el.className,el.id,el.getAttribute&&el.getAttribute('src'),el.getAttribute&&el.getAttribute('aria-label'),el.getAttribute&&el.getAttribute('title')].join(' ').toLowerCase();
    return /(check|tick|vink|complete|completed|done|success|status-ok)/.test(sig)||norm(el.textContent)==='✓';
  }
  function visualCheck(el){
    var r=el.getBoundingClientRect();
    if(r.width<18||r.width>64||r.height<18||r.height>64)return false;
    var s=getComputedStyle(el),p=el.parentElement?getComputedStyle(el.parentElement):null;
    return green(s.color)||green(s.backgroundColor)||(p&&(green(p.color)||green(p.backgroundColor)));
  }
  function findCheck(row){
    var nodes=[].slice.call(row.querySelectorAll('img,svg,span,i'));
    return nodes.find(explicitCheck)||nodes.find(visualCheck)||null;
  }
  function ensureFlowCheck(row){
    var check=row.querySelector('.bg-change-flow-check');
    if(check)return check;
    check=document.createElement('span');
    check.className='bg-change-flow-check';
    check.setAttribute('aria-hidden','true');
    check.textContent='✓';
    row.appendChild(check);
    return check;
  }
  function ensureImpact(row){
    if(row.querySelector('.bg-change-impact'))return;
    var impact=document.createElement('div');
    impact.className='bg-change-impact';
    impact.setAttribute('aria-label','Geraakte context: '+IMPACT_LABELS.join(', '));
    IMPACT_LABELS.forEach(function(label,index){
      var pill=document.createElement('span');pill.textContent=label;impact.appendChild(pill);
      if(index<IMPACT_LABELS.length-1){var arrow=document.createElement('i');arrow.textContent='→';arrow.setAttribute('aria-hidden','true');impact.appendChild(arrow);}
    });
    row.appendChild(impact);
  }
  function alignFlowChecks(rows){
    rows.forEach(function(row,index){
      var heading=findChangeLabel(row,CHANGE_STEPS[index]);
      var check=row.querySelector('.bg-change-flow-check');
      if(!heading||!check)return;
      var rr=row.getBoundingClientRect(),hr=heading.getBoundingClientRect();
      var size=check.getBoundingClientRect().height||42;
      check.style.top=Math.max(18,hr.top-rr.top+(hr.height-size)/2)+'px';
    });
  }
  function initChangeFlow(){
    var title=findHeading(document,CHANGE_TITLE);if(!title)return;
    var section=title.closest('section')||title.parentElement;if(!section)return;
    var rows=CHANGE_STEPS.map(function(label){var h=findChangeLabel(section,label);return h?changeStepContainer(h,section):null;});
    if(rows.some(function(row){return !row;}))return;
    section.setAttribute('data-bg-change-flow','');
    rows.forEach(function(row,index){
      row.setAttribute('data-bg-change-step',String(index+1));
      if(!row.hasAttribute('data-bg-change-status'))row.setAttribute('data-bg-change-status',index===0?'done':index===1?'active':'future');
      var source=findCheck(row);if(source&&!source.classList.contains('bg-change-flow-check'))source.setAttribute('data-bg-change-check-source','true');
      ensureFlowCheck(row);
    });
    ensureImpact(rows[1]);
    var progress=section.querySelector('.bg-change-progress');
    if(!progress){
      progress=document.createElement('span');
      progress.className='bg-change-progress';
      progress.setAttribute('data-bg-change-progress','');
      progress.setAttribute('aria-hidden','true');
      var fill=document.createElement('span');fill.className='bg-change-progress-fill';progress.appendChild(fill);section.appendChild(progress);
    }
    if(section.getAttribute('data-bg-change-flow-ready')==='true')return;
    section.setAttribute('data-bg-change-flow-ready','true');
    var maxProgress=0,raf=0;
    function layout(){
      alignFlowChecks(rows);
      var sr=section.getBoundingClientRect();
      var checks=rows.map(function(row){return row.querySelector('.bg-change-flow-check').getBoundingClientRect();});
      var centers=checks.map(function(c){return c.top+c.height/2;});
      var first=centers[0],last=centers[centers.length-1],firstCheck=checks[0];
      progress.style.left=(firstCheck.left-sr.left+firstCheck.width/2-2)+'px';
      progress.style.top=(first-sr.top)+'px';
      progress.style.height=Math.max(4,last-first)+'px';
      var rect=section.getBoundingClientRect();
      if(rect.bottom<=0||rect.top>=window.innerHeight)return;
      var trigger=window.innerHeight*.58;
      var current=Math.max(0,Math.min(1,(trigger-first)/Math.max(1,last-first)));
      maxProgress=Math.max(maxProgress,current);
      section.style.setProperty('--bg-change-progress',maxProgress.toFixed(4));
      var active=-1;
      rows.forEach(function(row,index){
        var threshold=index/(rows.length-1);
        var done=maxProgress+0.015>=threshold;
        if(done){row.setAttribute('data-bg-change-status','done');row.removeAttribute('aria-current');}
        else if(active===-1){active=index;row.setAttribute('data-bg-change-status','active');row.setAttribute('aria-current','step');}
        else{row.setAttribute('data-bg-change-status','future');row.removeAttribute('aria-current');}
      });
      if(active===-1)rows.forEach(function(row){row.removeAttribute('aria-current');});
    }
    function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;layout();});}
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule).catch(function(){});
    schedule();
  }

  function collectSliders(){
    var set=new Set([].slice.call(document.querySelectorAll(SLIDER_SELECTOR)));
    [].slice.call(document.querySelectorAll('.compare-before')).forEach(function(before){
      var parent=before.parentElement;
      if(parent&&parent.querySelector('.compare-after'))set.add(parent);
    });
    return [].slice.call(set).filter(function(slider){return slider.querySelector('.compare-before')&&slider.querySelector('.compare-after');});
  }

  function initSlider(slider){
    if(slider.getAttribute('data-bg-compare-ready')==='true')return;
    slider.setAttribute('data-bg-compare-slider','');
    slider.setAttribute('data-bg-compare-ready','true');
    var knob=slider.querySelector('.compare-knob');
    var dragging=false;

    function apply(raw){
      var value=Math.max(0,Math.min(100,Number(raw)||0));
      slider.style.setProperty('--split',value.toFixed(2)+'%');
      if(knob){
        knob.setAttribute('aria-valuemin','0');
        knob.setAttribute('aria-valuemax','100');
        knob.setAttribute('aria-valuenow',value.toFixed(0));
        knob.setAttribute('aria-disabled','false');
        knob.tabIndex=0;
      }
      return value;
    }
    function applyFromClientX(clientX){
      var r=slider.getBoundingClientRect();
      if(!r.width)return apply(50);
      return apply(((clientX-r.left)/r.width)*100);
    }
    function current(){
      var raw=parseFloat(getComputedStyle(slider).getPropertyValue('--split'));
      return Number.isFinite(raw)?raw:50;
    }

    slider.addEventListener('pointerdown',function(e){
      dragging=true;
      if(knob&&e.target===knob)knob.setPointerCapture?.(e.pointerId);
      applyFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    window.addEventListener('pointermove',function(e){
      if(!dragging)return;
      applyFromClientX(e.clientX);
      e.preventDefault();
      e.stopImmediatePropagation();
    },true);
    window.addEventListener('pointerup',function(e){
      if(!dragging)return;
      dragging=false;
      applyFromClientX(e.clientX);
      e.stopImmediatePropagation();
    },true);
    window.addEventListener('pointercancel',function(){dragging=false;},true);

    if(knob){
      knob.addEventListener('keydown',function(e){
        var value=current();
        if(e.key==='ArrowLeft')value-=5;
        else if(e.key==='ArrowRight')value+=5;
        else if(e.key==='Home')value=0;
        else if(e.key==='End')value=100;
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        apply(value);
      },true);
    }

    apply(current());
  }

  function ensureSliders(){collectSliders().forEach(initSlider);}

  initChangeFlow();
  ensureSliders();
  new MutationObserver(function(){initChangeFlow();ensureSliders();}).observe(document.documentElement,{childList:true,subtree:true});
})();
</script>`;

function normalizeLegacyBounds(html){
  return html
    .replace(/Math\.max\((?:8|6|30|40),\s*Math\.min\((?:92|94|70|60),/g, 'Math.max(0,Math.min(100,')
    .replace(/aria-valuemin=(['"])(?:6|8|30|40)\1/g, 'aria-valuemin="0"')
    .replace(/aria-valuemax=(['"])(?:94|92|70|60)\1/g, 'aria-valuemax="100"');
}

function stripExistingGuard(html){
  return html
    .replace(/<style\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<script\s+data-bg-context-slider-readable\b[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function applyHomepageContextSliderReadability(html){
  let next=stripExistingGuard(normalizeLegacyBounds(html));
  next=next.replace('</head>',`${STYLE}\n</head>`);
  next=next.replace('</body>',`${RUNTIME}\n</body>`);
  if(!next.includes('SLIDER_SELECTOR')||
     !next.includes('#compareSlider,.compare-slider,[data-compare-slider]')||
     !next.includes('data-bg-compare-slider')||
     !next.includes("aria-valuemin','0")||
     !next.includes("aria-valuemax','100")||
     !next.includes('Math.max(0,Math.min(100')||
     !next.includes('data-bg-change-flow')||
     !next.includes('data-bg-change-progress')||
     !next.includes('data-bg-change-status')||
     !next.includes('IMPACT_LABELS')||
     !next.includes('maxProgress=Math.max(maxProgress')||
     (next.match(/<style data-bg-context-slider-readable>/g)||[]).length!==1||
     (next.match(/<script data-bg-context-slider-readable>/g)||[]).length!==1){
    throw new Error('Compare-slider readability guard kon niet volledig worden toegepast');
  }
  return next;
}