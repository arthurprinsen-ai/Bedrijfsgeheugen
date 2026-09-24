(function(){
'use strict';
if(window.__BG_PRICING_INTERACTIONS_V5__) return;
window.__BG_PRICING_INTERACTIONS_V5__=true;
window.__BG_PRICING_V4_ACTIVE__='20260923-1300';
document.documentElement.dataset.bgPricingRuntime='v5';
document.documentElement.dataset.bgPricingInteractions='ready-v3';

var billing='monthly',mode='daily';
var phaseSet=['start','validate','grow','scale','professionalize','mature','stagnate','loss','crisis'];

function all(selector){return [].slice.call(document.querySelectorAll(selector));}

function selectStage(key){
  all('[data-bg-stage]').forEach(function(b){
    b.setAttribute('aria-selected',String(b.getAttribute('data-bg-stage')===key));
  });
  all('[data-bg-stage-panel]').forEach(function(p){
    p.hidden=p.getAttribute('data-bg-stage-panel')!==key;
  });
  var s=document.getElementById('bgSituation'),m=document.getElementById('bgMotion');
  if(s&&phaseSet.indexOf(key)>=0&&s.value!==key)s.value=key;
  else if(m&&key&&phaseSet.indexOf(key)<0&&m.value!==key)m.value=key;
  render();
}

function selectGroup(group){
  all('[data-bg-price-tab]').forEach(function(x){
    x.setAttribute('aria-selected',String(x.getAttribute('data-bg-price-tab')===group));
  });
  all('.bg-plan-card[data-bg-group]').forEach(function(card){
    card.hidden=card.getAttribute('data-bg-group')!==group;
  });
}

function applyBilling(next){
  billing=next==='yearly'?'yearly':'monthly';
  all('[data-bg-billing]').forEach(function(b){
    b.setAttribute('aria-pressed',String(b.getAttribute('data-bg-billing')===billing));
  });
  all('.bg-billing-price').forEach(function(el){
    var value=el.getAttribute(billing==='yearly'?'data-yearly':'data-monthly');
    if(value!==null)el.textContent=value;
  });
  all('.bg-billing-period').forEach(function(el){
    el.textContent=billing==='yearly'?(el.tagName==='SMALL'?'/jaar':'per jaar'):(el.tagName==='SMALL'?'/maand':'per maand');
  });
  all('a[href*="/afsluiten?plan="]').forEach(function(a){
    try{
      var u=new URL(a.href,location.origin);
      u.searchParams.set('billing',billing);
      a.href=u.toString();
    }catch(_){}
  });
  render();
}

function setRefresh(button){
  mode=button.getAttribute('data-v')||'daily';
  var refresh=document.getElementById('bgRefresh');
  if(refresh)refresh.querySelectorAll('button').forEach(function(x){
    x.classList.toggle('active',x===button);
  });
  render();
}

function render(){
  var situation=document.getElementById('bgSituation'),
      motion=document.getElementById('bgMotion'),
      goal=document.getElementById('bgGoal'),
      urgency=document.getElementById('bgUrgency'),
      emp=document.getElementById('bgEmployees'),
      src=document.getElementById('bgSources'),
      refresh=document.getElementById('bgRefresh'),
      recPlan=document.getElementById('bgRecPlan'),
      recPrice=document.getElementById('bgRecPrice'),
      recWhy=document.getElementById('bgRecWhy'),
      recCta=document.getElementById('bgRecCta'),
      recBreakdown=document.getElementById('bgRecBreakdown');

  if(!emp||!src||!refresh||!recPlan||!recPrice||!recWhy||!recCta||!recBreakdown)return;

  var stage=situation?situation.value:'grow',
      motionValue=motion?motion.value:'',
      goalValue=goal?goal.value:'',
      u=urgency?urgency.value:'normal',
      e=Number(emp.value),
      s=Math.max(1,Number(src.value)||1),
      plan='Control',
      monthly='€ 1.495',
      yearly='€ 14.950',
      why='Past bij een overzichtelijke dataketen met maximaal 5 bronnen en dagelijkse synchronisatie. De gekozen bedrijfsfase en doelen blijven als context actief in het portaal.',
      href='https://www.bedrijfsgeheugen.nl/afsluiten?plan=control',
      cta='Start online';

  if(stage==='loss'){
    plan=u==='urgent'?'Continuïteitsdiagnose':'Herstelscan';
    monthly=u==='urgent'?'vanaf € 7.500':'€ 4.950';
    yearly=monthly;
    why=u==='urgent'?'Eerst cash runway, verplichtingen en acute beslissingen objectief maken.':'Eerst vaststellen waar marge, cash en uitvoeringskracht weglekken.';
    href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek herstel';
  }else if(stage==='crisis'){
    plan=u==='normal'?'Stabilize Sprint':'Continuïteitsdiagnose';
    monthly=u==='normal'?'vanaf € 19.500':'vanaf € 7.500';
    yearly=monthly;
    why='Acute continuïteitsdruk vraagt eerst om cash, scenario’s, afhankelijkheden en een bestuurbare actielijst.';
    href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek urgentie';
  }else if(motionValue==='buy'){
    plan='Operational & Data DD';monthly='vanaf € 12.500';yearly=monthly;
    why='Voor aankoopbesluiten combineren we performance, operationele risico’s, data/tech en integratie-uitvoerbaarheid.';
    href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek target';
  }else if(motionValue==='sell'){
    plan='Exit Readiness Scan';monthly='€ 4.950';yearly=monthly;
    why='Voor verkoop begint waardecreatie bij overdraagbaarheid, bewijs, KPI-kwaliteit en het wegnemen van vermijdbare risico’s.';
    href='https://www.bedrijfsgeheugen.nl/contact';cta='Check verkoopbaarheid';
  }else if(motionValue==='portfolio'){
    plan='Portfolio Control';monthly='vanaf € 3.500';yearly='vanaf € 35.000';
    why='Voor meerdere participaties is één vergelijkbare definitie van performance, risico en value creation belangrijker dan losse dashboards.';
    href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek portfolio';
  }else if(s>15||e>250||mode==='realtime'){
    plan='Enterprise';monthly='vanaf € 4.995';yearly='vanaf € 49.950';
    why='Past bij 15+ bronnen, meerdere entiteiten, near-realtime eisen of zwaardere governance.';
    href='https://www.bedrijfsgeheugen.nl/contact';cta='Bespreek Enterprise';
  }else if(s>5||e>50||mode==='hourly'){
    plan='Scale';monthly='€ 2.495';yearly='€ 24.950';
    why='Past bij meerdere teams en systemen, tot 15 bronnen, uurverversing en voorspellende signalering.';
    href='https://www.bedrijfsgeheugen.nl/afsluiten?plan=scale';cta='Start Scale online';
  }

  var oneOff=(stage==='loss'||stage==='crisis'||motionValue==='buy'||motionValue==='sell');
  recPlan.textContent=plan;
  recPrice.textContent=oneOff?monthly+' eenmalig / vanaf':(billing==='yearly'?yearly+' /jaar':monthly+' /maand');
  recWhy.textContent=why;
  if(href.indexOf('/afsluiten?plan=')>=0){
    try{
      var checkoutUrl=new URL(href,location.origin);
      checkoutUrl.searchParams.set('billing',billing);
      href=checkoutUrl.toString();
    }catch(_){}
  }
  recCta.href=href;recCta.textContent=cta;
  var labels={daily:'dagelijks',hourly:'ieder uur',realtime:'near-realtime'},
      stageLabel=situation?situation.options[situation.selectedIndex].text:stage,
      motionLabel=motionValue&&motion?motion.options[motion.selectedIndex].text:'geen specifieke gebeurtenis',
      goalLabel=goalValue&&goal?goal.options[goal.selectedIndex].text:'doel nog niet gekozen';
  recBreakdown.textContent=stageLabel+' · '+motionLabel+' · '+goalLabel+' · '+s+' bronnen · '+labels[mode]+' · '+emp.options[emp.selectedIndex].text+' medewerkers';
}

document.addEventListener('click',function(event){
  var target=event.target&&event.target.closest?event.target.closest('[data-bg-stage],[data-bg-price-tab],[data-bg-billing],#bgRefresh button[data-v]'):null;
  if(!target)return;
  if(target.hasAttribute('data-bg-stage')){
    event.preventDefault();
    selectStage(target.getAttribute('data-bg-stage'));
  }else if(target.hasAttribute('data-bg-price-tab')){
    event.preventDefault();
    selectGroup(target.getAttribute('data-bg-price-tab'));
  }else if(target.hasAttribute('data-bg-billing')){
    event.preventDefault();
    applyBilling(target.getAttribute('data-bg-billing'));
  }else if(target.matches('#bgRefresh button[data-v]')){
    event.preventDefault();
    setRefresh(target);
  }
},true);

document.addEventListener('change',function(event){
  var el=event.target;
  if(!el)return;
  if(el.id==='bgSituation')selectStage(el.value);
  else if(el.id==='bgMotion'&&['buy','sell','portfolio'].indexOf(el.value)>=0)selectStage(el.value);
  else if(['bgGoal','bgUrgency','bgEmployees'].indexOf(el.id)>=0)render();
},true);

document.addEventListener('input',function(event){
  if(event.target&&event.target.id==='bgSources')render();
},true);

function init(){
  selectGroup('start');
  applyBilling('monthly');
  selectStage('grow');
  document.documentElement.dataset.bgPricingReady='true';
document.documentElement.dataset.bgPricingInteractions='ready-v3';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();