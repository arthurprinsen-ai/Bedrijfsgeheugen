(function(){
'use strict';
var PHASES=['start','validate','grow','scale','professionalize','mature','stagnate','loss','crisis'];
var state={billing:'monthly',refresh:'daily'};

function all(sel){return Array.prototype.slice.call(document.querySelectorAll(sel));}
function setSelected(nodes,attr,key){
  nodes.forEach(function(node){
    var active=node.getAttribute(attr)===key;
    node.setAttribute(attr==='data-bg-billing'?'aria-pressed':'aria-selected',String(active));
    if(node.getAttribute('role')==='tab') node.tabIndex=active?0:-1;
  });
}
function setGroup(key){
  setSelected(all('[data-bg-price-tab]'),'data-bg-price-tab',key);
  all('.bg-plan-card[data-bg-group]').forEach(function(card){
    var active=card.getAttribute('data-bg-group')===key;
    card.hidden=!active;
    card.classList.toggle('is-active',active);
    card.setAttribute('aria-hidden',String(!active));
  });
}
function setStage(key,fromCalculator){
  setSelected(all('[data-bg-stage]'),'data-bg-stage',key);
  all('[data-bg-stage-panel]').forEach(function(panel){
    var active=panel.getAttribute('data-bg-stage-panel')===key;
    panel.hidden=!active;
    panel.classList.toggle('is-active',active);
    panel.setAttribute('aria-hidden',String(!active));
  });
  if(!fromCalculator){
    var situation=document.getElementById('bgSituation');
    var motion=document.getElementById('bgMotion');
    if(situation&&PHASES.indexOf(key)>=0&&situation.value!==key) situation.value=key;
    if(motion&&PHASES.indexOf(key)<0&&motion.value!==key) motion.value=key;
  }
  render();
}
function setBilling(key){
  state.billing=key==='yearly'?'yearly':'monthly';
  setSelected(all('[data-bg-billing]'),'data-bg-billing',state.billing);
  all('.bg-billing-price').forEach(function(el){
    var value=el.getAttribute(state.billing==='yearly'?'data-yearly':'data-monthly');
    if(value) el.textContent=value;
  });
  all('.bg-billing-period').forEach(function(el){
    el.textContent=state.billing==='yearly'?'/jaar':'/maand';
  });
  all('a[href*="/afsluiten?plan="]').forEach(function(a){
    try{
      var url=new URL(a.href,location.origin);
      url.searchParams.set('billing',state.billing);
      a.href=url.toString();
    }catch(ignore){}
  });
  render();
}
function setRefresh(key){
  state.refresh=key||'daily';
  all('#bgRefresh button[data-v]').forEach(function(button){
    var active=button.getAttribute('data-v')===state.refresh;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  render();
}
function render(){
  var situation=document.getElementById('bgSituation');
  var motion=document.getElementById('bgMotion');
  var goal=document.getElementById('bgGoal');
  var urgency=document.getElementById('bgUrgency');
  var employees=document.getElementById('bgEmployees');
  var sources=document.getElementById('bgSources');
  var refresh=document.getElementById('bgRefresh');
  var recPlan=document.getElementById('bgRecPlan');
  var recPrice=document.getElementById('bgRecPrice');
  var recWhy=document.getElementById('bgRecWhy');
  var recCta=document.getElementById('bgRecCta');
  var recBreakdown=document.getElementById('bgRecBreakdown');
  if(!employees||!sources||!refresh||!recPlan||!recPrice||!recWhy||!recCta||!recBreakdown) return;

  var stage=situation?situation.value:'grow';
  var motionValue=motion?motion.value:'';
  var goalValue=goal?goal.value:'';
  var urgencyValue=urgency?urgency.value:'normal';
  var employeeCount=Number(employees.value);
  var sourceCount=Math.max(1,Number(sources.value)||1);
  var plan='Control',monthly='€ 1.495',yearly='€ 14.950';
  var why='Past bij een overzichtelijke dataketen met maximaal 5 bronnen en dagelijkse synchronisatie. De gekozen bedrijfsfase en doelen blijven als context actief in het portaal.';
  var href='https://www.bedrijfsgeheugen.nl/afsluiten?plan=control',cta='Start online';

  if(stage==='loss'){
    plan=urgencyValue==='urgent'?'Continuïteitsdiagnose':'Herstelscan';
    monthly=urgencyValue==='urgent'?'vanaf € 7.500':'€ 4.950'; yearly=monthly;
    why=urgencyValue==='urgent'?'Eerst cash runway, verplichtingen en acute beslissingen objectief maken.':'Eerst vaststellen waar marge, cash en uitvoeringskracht weglekken.';
    href='https://www.bedrijfsgeheugen.nl/contact'; cta='Bespreek herstel';
  } else if(stage==='crisis'){
    plan=urgencyValue==='normal'?'Stabilize Sprint':'Continuïteitsdiagnose';
    monthly=urgencyValue==='normal'?'vanaf € 19.500':'vanaf € 7.500'; yearly=monthly;
    why='Acute continuïteitsdruk vraagt eerst om cash, scenario’s, afhankelijkheden en een bestuurbare actielijst.';
    href='https://www.bedrijfsgeheugen.nl/contact'; cta='Bespreek urgentie';
  } else if(motionValue==='buy'){
    plan='Operational & Data DD'; monthly='vanaf € 12.500'; yearly=monthly;
    why='Voor aankoopbesluiten combineren we performance, operationele risico’s, data/tech en integratie-uitvoerbaarheid.';
    href='https://www.bedrijfsgeheugen.nl/contact'; cta='Bespreek target';
  } else if(motionValue==='sell'){
    plan='Exit Readiness Scan'; monthly='€ 4.950'; yearly=monthly;
    why='Voor verkoop begint waardecreatie bij overdraagbaarheid, bewijs, KPI-kwaliteit en het wegnemen van vermijdbare risico’s.';
    href='https://www.bedrijfsgeheugen.nl/contact'; cta='Check verkoopbaarheid';
  } else if(motionValue==='portfolio'){
    plan='Portfolio Control'; monthly='vanaf € 3.500'; yearly='vanaf € 35.000';
    why='Voor meerdere participaties is één vergelijkbare definitie van performance, risico en value creation belangrijker dan losse dashboards.';
    href='https://www.bedrijfsgeheugen.nl/contact'; cta='Bespreek portfolio';
  } else if(sourceCount>15||employeeCount>250||state.refresh==='realtime'){
    plan='Enterprise'; monthly='vanaf € 4.995'; yearly='vanaf € 49.950';
    why='Past bij 15+ bronnen, meerdere entiteiten, near-realtime eisen of zwaardere governance.';
    href='https://www.bedrijfsgeheugen.nl/contact'; cta='Bespreek Enterprise';
  } else if(sourceCount>5||employeeCount>50||state.refresh==='hourly'){
    plan='Scale'; monthly='€ 2.495'; yearly='€ 24.950';
    why='Past bij meerdere teams en systemen, tot 15 bronnen, uurverversing en voorspellende signalering.';
    href='https://www.bedrijfsgeheugen.nl/afsluiten?plan=scale'; cta='Start Scale online';
  }

  var oneOff=(stage==='loss'||stage==='crisis'||motionValue==='buy'||motionValue==='sell');
  recPlan.textContent=plan;
  recPrice.textContent=oneOff?monthly+' eenmalig / vanaf':(state.billing==='yearly'?yearly+' /jaar':monthly+' /maand');
  recWhy.textContent=why;
  if(href.indexOf('/afsluiten?plan=')>=0){
    try{var checkout=new URL(href,location.origin);checkout.searchParams.set('billing',state.billing);href=checkout.toString();}catch(ignore){}
  }
  recCta.href=href; recCta.textContent=cta;
  var labels={daily:'dagelijks',hourly:'ieder uur',realtime:'near-realtime'};
  var stageLabel=situation?situation.options[situation.selectedIndex].text:stage;
  var motionLabel=motionValue&&motion?motion.options[motion.selectedIndex].text:'geen specifieke gebeurtenis';
  var goalLabel=goalValue&&goal?goal.options[goal.selectedIndex].text:'doel nog niet gekozen';
  recBreakdown.textContent=stageLabel+' · '+motionLabel+' · '+goalLabel+' · '+sourceCount+' bronnen · '+labels[state.refresh]+' · '+employees.options[employees.selectedIndex].text+' medewerkers';
}
function bindCalculator(){
  var situation=document.getElementById('bgSituation');
  var motion=document.getElementById('bgMotion');
  ['bgGoal','bgUrgency','bgEmployees'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.addEventListener('change',render);
  });
  var sources=document.getElementById('bgSources'); if(sources) sources.addEventListener('input',render);
  if(situation) situation.addEventListener('change',function(){setStage(situation.value,true);});
  if(motion) motion.addEventListener('change',function(){
    if(['buy','sell','portfolio'].indexOf(motion.value)>=0) setStage(motion.value,true); else render();
  });
}
function bindClicks(){
  document.addEventListener('click',function(event){
    var button=event.target.closest('[data-bg-price-tab],[data-bg-billing],[data-bg-stage],#bgRefresh button[data-v]');
    if(!button) return;
    if(button.matches('[data-bg-price-tab]')){event.preventDefault();setGroup(button.getAttribute('data-bg-price-tab'));}
    else if(button.matches('[data-bg-billing]')){event.preventDefault();setBilling(button.getAttribute('data-bg-billing'));}
    else if(button.matches('[data-bg-stage]')){event.preventDefault();setStage(button.getAttribute('data-bg-stage'),false);}
    else if(button.matches('#bgRefresh button[data-v]')){event.preventDefault();setRefresh(button.getAttribute('data-v'));}
  });
  document.addEventListener('keydown',function(event){
    var tab=event.target.closest('[role="tab"][data-bg-price-tab],[role="tab"][data-bg-stage]');
    if(!tab||['ArrowLeft','ArrowRight','Home','End'].indexOf(event.key)<0) return;
    var selector=tab.hasAttribute('data-bg-price-tab')?'[role="tab"][data-bg-price-tab]':'[role="tab"][data-bg-stage]';
    var tabs=all(selector),index=tabs.indexOf(tab); if(index<0) return;
    event.preventDefault();
    var next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    tabs[next].click();tabs[next].focus();
  });
}
function init(){
  bindClicks();bindCalculator();
  var initialGroup=(document.querySelector('[data-bg-price-tab][aria-selected="true"]')||{}).dataset;
  var initialStage=(document.querySelector('[data-bg-stage][aria-selected="true"]')||{}).dataset;
  var initialBilling=(document.querySelector('[data-bg-billing][aria-pressed="true"]')||{}).dataset;
  var initialRefresh=(document.querySelector('#bgRefresh button.active')||{}).dataset;
  setGroup(initialGroup&&initialGroup.bgPriceTab||'start');
  setBilling(initialBilling&&initialBilling.bgBilling||'monthly');
  setRefresh(initialRefresh&&initialRefresh.v||'daily');
  setStage(initialStage&&initialStage.bgStage||'grow',false);
  document.documentElement.dataset.bgPricingInteractions='v3';
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();