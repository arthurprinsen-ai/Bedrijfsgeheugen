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
    el.textContent=state.billing==='yearly'?(el.tagName==='SMALL'?'/jaar':'per jaar'):(el.tagName==='SMALL'?'/maand':'per maand');
  });
  all('a[href*="/afsluiten?plan="]').forEach(function(a){
    try{var url=new URL(a.href,location.origin);url.searchParams.set('billing',state.billing);a.href=url.toString();}catch(ignore){}
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
  var situation=document.getElementById('bgSituation'),motion=document.getElementById('bgMotion'),goal=document.getElementById('bgGoal'),urgency=document.getElementById('bgUrgency'),employees=document.getElementById('bgEmployees'),sources=document.getElementById('bgSources'),refresh=document.getElementById('bgRefresh');
  var recPlan=document.getElementById('bgRecPlan'),recPrice=document.getElementById('bgRecPrice'),recWhy=document.getElementById('bgRecWhy'),recCta=document.getElementById('bgRecCta'),recBreakdown=document.getElementById('bgRecBreakdown');
  if(!employees||!sources||!refresh||!recPlan||!recPrice||!recWhy||!recCta||!recBreakdown)return;
  var stage=situation?situation.value:'grow',motionValue=motion?motion.value:'',goalValue=goal?goal.value:'',urgencyValue=urgency?urgency.value:'normal',employeeCount=Number(employees.value),sourceCount=Math.max(1,Number(sources.value)||1);
  var plan='Control',monthly='€ 1.495',yearly='€ 14.950',why='Past bij een overzichtelijke dataketen met maximaal 5 bronnen en dagelijkse synchronisatie. De gekozen bedrijfsfase en doelen blijven als context actief in het portaal.',href='https://www.bedrijfsgeheugen.nl/afsluiten?plan=control',cta='Start online';
  if(stage==='loss'){plan=urgencyValue==='urgent'?'Continuïteitsdiagnose':'Herstelscan';monthly=urgencyValue==='urgent'?'vanaf € 7.500':'€ 4.950';yearly=monthly;why=urgencyValue==='urgent'?'Eerst cash runway, verplichtingen en acute beslissingen objectief maken.':'Eerst vaststellen waar marge, cash en uitvoeringskracht weglekken.';href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek herstel';}
  else if(stage==='crisis'){plan=urgencyValue==='normal'?'Stabilize Sprint':'Continuïteitsdiagnose';monthly=urgencyValue==='normal'?'vanaf € 19.500':'vanaf € 7.500';yearly=monthly;why='Acute continuïteitsdruk vraagt eerst om cash, scenario’s, afhankelijkheden en een bestuurbare actielijst.';href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek urgentie';}
  else if(motionValue==='buy'){plan='Operational & Data DD';monthly='vanaf € 12.500';yearly=monthly;why='Voor aankoopbesluiten combineren we performance, operationele risico’s, data/tech en integratie-uitvoerbaarheid.';href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek target';}
  else if(motionValue==='sell'){plan='Exit Readiness Scan';monthly='€ 4.950';yearly=monthly;why='Voor verkoop begint waardecreatie bij overdraagbaarheid, bewijs, KPI-kwaliteit en het wegnemen van vermijdbare risico’s.';href='https://www.bedrijfsgeheugen.nl/contact';cta='Check verkoopbaarheid';}
  else if(motionValue==='portfolio'){plan='Portfolio Control';monthly='vanaf € 3.500';yearly='vanaf € 35.000';why='Voor meerdere participaties is één vergelijkbare definitie van performance, risico en value creation belangrijker dan losse dashboards.';href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek portfolio';}
  else if(sourceCount>15||employeeCount>250||state.refresh==='realtime'){plan='Enterprise';monthly='vanaf € 4.995';yearly='vanaf € 49.950';why='Past bij 15+ bronnen, meerdere entiteiten, near-realtime eisen of zwaardere governance.';href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek Enterprise';}
  else if(sourceCount>5||employeeCount>50||state.refresh==='hourly'){plan='Scale';monthly='€ 2.495';yearly='€ 24.950';why='Past bij meerdere teams en systemen, tot 15 bronnen, uurverversing en voorspellende signalering.';href='https://www.bedrijfsgeheugen.nl/afsluiten?plan=scale';cta='Start Scale online';}
  var oneOff=(stage==='loss'||stage==='crisis'||motionValue==='buy'||motionValue==='sell');
  recPlan.textContent=plan;recPrice.textContent=oneOff?monthly+' eenmalig / vanaf':(state.billing==='yearly'?yearly+' /jaar':monthly+' /maand');recWhy.textContent=why;
  if(href.indexOf('/afsluiten?plan=')>=0){try{var checkout=new URL(href,location.origin);checkout.searchParams.set('billing',state.billing);href=checkout.toString();}catch(ignore){}}
  recCta.href=href;recCta.textContent=cta;
  var labels={daily:'dagelijks',hourly:'ieder uur',realtime:'near-realtime'},stageLabel=situation?situation.options[situation.selectedIndex].text:stage,motionLabel=motionValue&&motion?motion.options[motion.selectedIndex].text:'geen specifieke gebeurtenis',goalLabel=goalValue&&goal?goal.options[goal.selectedIndex].text:'doel nog niet gekozen';
  recBreakdown.textContent=stageLabel+' · '+motionLabel+' · '+goalLabel+' · '+sourceCount+' bronnen · '+labels[state.refresh]+' · '+employees.options[employees.selectedIndex].text+' medewerkers';
}
function handleClick(event){
  var button=event.target.closest&&event.target.closest('[data-bg-price-tab],[data-bg-billing],[data-bg-stage],#bgRefresh button[data-v]');
  if(!button)return;
  event.preventDefault();
  if(button.matches('[data-bg-price-tab]'))setGroup(button.getAttribute('data-bg-price-tab'));
  else if(button.matches('[data-bg-billing]'))setBilling(button.getAttribute('data-bg-billing'));
  else if(button.matches('[data-bg-stage]'))setStage(button.getAttribute('data-bg-stage'),false);
  else setRefresh(button.getAttribute('data-v'));
}
function handleChange(event){
  var el=event.target;
  if(!el)return;
  if(el.id==='bgSituation')setStage(el.value,true);
  else if(el.id==='bgMotion'&&['buy','sell','portfolio'].indexOf(el.value)>=0)setStage(el.value,true);
  else if(['bgMotion','bgGoal','bgUrgency','bgEmployees'].indexOf(el.id)>=0)render();
}
function handleInput(event){if(event.target&&event.target.id==='bgSources')render();}
function init(){
  if(document.documentElement.dataset.bgPricingInteractions==='v4')return;
  document.documentElement.dataset.bgPricingInteractions='v4';
  document.addEventListener('click',handleClick);
  document.addEventListener('change',handleChange);
  document.addEventListener('input',handleInput);
  document.addEventListener('keydown',function(event){
    var tab=event.target.closest&&event.target.closest('[role="tab"][data-bg-price-tab],[role="tab"][data-bg-stage]');
    if(!tab||['ArrowLeft','ArrowRight','Home','End'].indexOf(event.key)<0)return;
    var selector=tab.hasAttribute('data-bg-price-tab')?'[role="tab"][data-bg-price-tab]':'[role="tab"][data-bg-stage]';
    var tabs=all(selector),index=tabs.indexOf(tab);if(index<0)return;
    event.preventDefault();var next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();
  });
  var g=document.querySelector('[data-bg-price-tab][aria-selected="true"]'),s=document.querySelector('[data-bg-stage][aria-selected="true"]'),b=document.querySelector('[data-bg-billing][aria-pressed="true"]'),r=document.querySelector('#bgRefresh button.active');
  setGroup(g?g.getAttribute('data-bg-price-tab'):'start');setBilling(b?b.getAttribute('data-bg-billing'):'monthly');setRefresh(r?r.getAttribute('data-v'):'daily');setStage(s?s.getAttribute('data-bg-stage'):'grow',false);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();