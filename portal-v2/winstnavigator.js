import {buildForesightStudioModel} from './foresight-scenario-studio.js?bg_explain=80ad881b4217977c9eb4684228d3191e5631c0f2c0e4dce43f4a956ba895387a';
import {navigatePortal} from './router.js?bg_explain=80ad881b4217977c9eb4684228d3191e5631c0f2c0e4dce43f4a956ba895387a';
export const NAVIGATOR_VERSION='winstnavigator-20261020-v1';
const IDS=['revenue_growth','profit','cash','automate','valuation','exit','resilience'];
const DESCRIPTION={
 revenue_growth:'Groei kan capaciteit en werkkapitaal raken.',
 profit:'Je winstmarge wordt mede beïnvloed door omzet, kosten en productiviteit.',
 cash:'Liquiditeit bepaalt hoeveel ruimte je hebt om bij te sturen.',
 automate:'Minder handwerk kan tijd vrijmaken; gemeten resultaat blijft leidend.',
 valuation:'Bedrijfswaarde hangt samen met winst, risico en overdraagbaarheid.',
 exit:'Een overdraagbaar bedrijf hangt minder van één persoon af.',
 resilience:'Risico kan omzet, continuïteit en klantvertrouwen beïnvloeden.'
};
export function buildWinstnavigatorModel(state={},options={}){
 const metric=IDS.includes(options.metric)?options.metric:'profit';
 const days=[30,90,180,365].includes(Number(options.days))?Number(options.days):90;
 const sensitivity=Math.max(-30,Math.min(30,Number(options.sensitivity)||0));
 const base=buildForesightStudioModel(state,{metric,days,sensitivity,asOf:options.asOf});
 const selected=base.metrics.find(m=>m.id===metric)||base.active;
 return {selected,metrics:base.metrics.filter(m=>IDS.includes(m.id)),history:selected?.history||[],
   current:selected?.current??null,forecast:selected?.forecast??null,scenario:base.scenario,
   days,sensitivity,quality:selected?.quality||'INSUFFICIENT_HISTORY',available:base.available,
   related:selected?.related||[],description:DESCRIPTION[metric]};
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
const fmt=(v,u='')=>v==null||!Number.isFinite(Number(v))?'Onbekend':u==='€'
 ?new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v)
 :Number(v).toLocaleString('nl-NL',{maximumFractionDigits:1})+(u?' '+u:'');
function spark(points,forecast,scenario){
 if(!points.length)return el('p','Nog geen historische metingen voor deze visualisatie.','bg-w-nav-empty');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 600 205');svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Gemeten tijdreeks met eventueel verkennende trend, bandbreedte en scenario');svg.classList.add('bg-w-nav-chart');
 const hist=points.slice(-30), vals=hist.map(p=>p.value);
 if(forecast)vals.push(forecast.lower,forecast.expected,forecast.upper);
 if(scenario)vals.push(scenario.simulated);
 const lo=Math.min(...vals),span=Math.max(1e-8,Math.max(...vals)-lo);
 const x=i=>20+i/(Math.max(hist.length,1))*525,y=v=>178-(Number(v)-lo)/span*145;
 const add=(name,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));svg.append(n);return n};
 add('line',{x1:20,y1:178,x2:570,y2:178,stroke:'#a4c6d5'});
 add('polyline',{points:hist.map((p,i)=>x(i)+','+y(p.value)).join(' '),fill:'none',stroke:'#176ca4','stroke-width':3,'stroke-linecap':'round'});
 hist.forEach((p,i)=>{const c=add('circle',{cx:x(i),cy:y(p.value),r:i===hist.length-1?4:2,fill:'#176ca4'});
 const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=p.date+': '+fmt(p.value);c.append(title)});
 if(forecast){
  const last=hist.at(-1);add('polygon',{points:x(hist.length-1)+','+y(last.value)+' 570,'+y(forecast.upper)+' 570,'+y(forecast.lower),fill:'#78cee5','fill-opacity':.25});
  add('line',{x1:x(hist.length-1),y1:y(last.value),x2:570,y2:y(forecast.expected),stroke:'#17967f','stroke-width':3,'stroke-dasharray':'7 5'});
  if(scenario?.sensitivity)add('line',{x1:x(hist.length-1),y1:y(last.value),x2:570,y2:y(scenario.simulated),stroke:'#9d57cf','stroke-width':3,'stroke-dasharray':'4 6'});
 }
 return svg;
}
export function mountWinstnavigator({domainState,stateClient}={}){
 if(typeof document==='undefined'||!domainState?.get||!stateClient?.getSnapshot)return null;
 if(document.getElementById('bgWinstnavigator'))return null;
 const launch=el('button','✦ Winstnavigator','bg-w-nav-launch');launch.type='button';launch.hidden=true;
 launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-controls','bgWinstnavigator');
 const dialog=el('dialog',undefined,'bg-w-nav');dialog.id='bgWinstnavigator';
 dialog.setAttribute('aria-labelledby','bgWinstnavTitle');
 const head=el('header',undefined,'bg-w-nav-head');
 head.append(el('small','POWERHOUSE · INTERACTIEVE BUSINESS TWIN'));
 const title=el('h2','Je bedrijf, alles verbonden');title.id='bgWinstnavTitle';head.append(title);
 head.append(el('p','Klik, hover, scroll of veeg. Ontdek de betekenis van echte gegevens en verken je volgende ondernemersbeslissing.'));
 const closeButton=el('button','×','bg-w-nav-close');closeButton.type='button';closeButton.setAttribute('aria-label','Sluiten');head.append(closeButton);
 const content=el('div',undefined,'bg-w-nav-body');
 const orbit=el('section',undefined,'bg-w-nav-orbit');orbit.tabIndex=0;orbit.setAttribute('aria-label','Bedrijfsdomeinen: gebruik de pijltjestoetsen of het scrollwiel om te navigeren');
 const hub=el('div',undefined,'bg-w-nav-hub');hub.append(el('small','JOUW BEDRIJF'),el('strong','Alles raakt elkaar'),el('span','Conceptuele relaties — geen automatische causaliteit'));orbit.append(hub);
 const detail=el('section',undefined,'bg-w-nav-detail');content.append(orbit,detail);
 const foot=el('footer','Bestaande Foresight-data · geen voorbeeldcijfers · bron en onzekerheid blijven zichtbaar');
 dialog.append(head,content,foot);document.body.append(launch,dialog);
 const ui={metric:'profit',days:90,sensitivity:0,subject:'',idx:null,model:null};
 const subjectOf=s=>(s&&(s.mode==='authenticated'||s.mode==='empty')&&s.user&&!stateClient.isDemo?.())?String(s.user.id||''):'';
 const isAllowed=()=>!!subjectOf(stateClient.getSnapshot());
 const model=()=>buildWinstnavigatorModel(domainState.get()||{},{metric:ui.metric,days:ui.days,sensitivity:ui.sensitivity});
 function close(){if(dialog.open)dialog.close();document.body.classList.remove('bg-w-nav-open')}
 function reset(){ui.metric='profit';ui.days=90;ui.sensitivity=0;ui.idx=null;ui.model=null;close();detail.replaceChildren();orbit.replaceChildren(hub)}
 stateClient.subscribe(s=>{const subject=subjectOf(s);if(subject!==ui.subject){reset();ui.subject=subject}launch.hidden=!subject;if(!subject)close()});
 launch.hidden=!subjectOf(stateClient.getSnapshot());ui.subject=subjectOf(stateClient.getSnapshot());
 function choose(id){if(!IDS.includes(id)||!isAllowed())return;ui.metric=id;ui.sensitivity=0;ui.idx=null;ui.model=model();paintOrbit();paintDetail()}
 function go(id){close();navigatePortal(id)}
 function paintOrbit(){
  orbit.replaceChildren(hub);
  ui.model.metrics.forEach((m,i)=>{
   const theta=2*Math.PI*i/ui.model.metrics.length-Math.PI/2;
   const b=el('button',undefined,'bg-w-nav-node');b.type='button';b.dataset.goal=m.id;
   b.style.setProperty('--x',(50+35*Math.cos(theta)).toFixed(2)+'%');b.style.setProperty('--y',(50+35*Math.sin(theta)).toFixed(2)+'%');
   b.setAttribute('aria-pressed',String(m.id===ui.metric));
   b.append(el('strong',m.label),el('small',m.history.length?m.history.length+' meetmomenten':'Nog geen meetreeks'));
   b.addEventListener('click',()=>choose(m.id));
   b.addEventListener('mouseenter',()=>{hub.querySelector('strong').textContent=m.label;hub.querySelector('span').textContent=DESCRIPTION[m.id]});
   b.addEventListener('focus',()=>{hub.querySelector('strong').textContent=m.label;hub.querySelector('span').textContent=DESCRIPTION[m.id]});
   b.addEventListener('mouseleave',()=>{hub.querySelector('strong').textContent='Alles raakt elkaar';hub.querySelector('span').textContent='Conceptuele relaties — geen automatische causaliteit'});
   orbit.append(b);
  });
 }
 function cycle(d){choose(IDS[(IDS.indexOf(ui.metric)+d+IDS.length)%IDS.length])}
 let lastWheel=0;
 orbit.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<5||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;e.preventDefault();const now=Date.now();if(now-lastWheel>230){lastWheel=now;cycle(e.deltaY>0?1:-1)}},{passive:false});
 orbit.addEventListener('keydown',e=>{if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();cycle(['ArrowRight','ArrowDown'].includes(e.key)?1:-1);orbit.querySelector('[data-goal="'+ui.metric+'"]')?.focus({preventScroll:true})}});
 function paintDetail(){
  const m=ui.model.selected;if(!m)return;detail.replaceChildren();
  const top=el('div',undefined,'bg-w-nav-top');top.append(el('h3',m.label),el('small',ui.model.quality==='INSUFFICIENT_HISTORY'?'Historiek ontbreekt':'Verkennende trend — niet onafhankelijk gevalideerd'));detail.append(top);
  const nums=el('div',undefined,'bg-w-nav-numbers');
  const a=el('div');a.append(el('small','Laatste echte meting'),el('strong',fmt(ui.model.current,m.unit)));
  const b=el('div');b.append(el('small','Vastgelegd doel'),el('strong',fmt(m.target,m.unit)));nums.append(a,b);detail.append(nums);
  detail.append(el('p',ui.model.description+' Dit is bedrijfscontext, geen berekend causaal effect.','bg-w-nav-context'));
  const history=ui.model.history,forecast=ui.model.forecast,scenario=ui.model.scenario;
  const chart=el('div',undefined,'bg-w-nav-graph');chart.append(el('h4','Tijdmachine: van werkelijk naar mogelijk'),spark(history,forecast,scenario));
  if(history.length){
   const label=el('label',undefined,'bg-w-nav-time');
   label.append(el('span','Sleep door je echte meetmomenten'));
   const input=el('input');input.type='range';input.min=0;input.max=history.length-1;input.step=1;input.value=Math.max(0,Math.min(history.length-1,ui.idx??history.length-1));
   input.setAttribute('aria-label','Historisch meetmoment kiezen');
   const output=el('output');
   const update=()=>{ui.idx=Number(input.value);const p=history[ui.idx];output.textContent=p.date+' · '+fmt(p.value,m.unit)+' · '+p.source+(p.evidenceRef?' · bronref aanwezig':' · geen bronref')};
   input.addEventListener('input',update);update();label.append(input,output);chart.append(label);
  }
  detail.append(chart);
  const controls=el('div',undefined,'bg-w-nav-controls');
  const horizon=el('div',undefined,'bg-w-nav-horizon');horizon.append(el('span','Vooruitkijken'));
  const buttons=el('div',undefined,'bg-w-nav-btns');
  for(const days of [30,90,180,365]){const btn=el('button',days+' dagen');btn.type='button';btn.setAttribute('aria-pressed',String(days===ui.days));btn.addEventListener('click',()=>{ui.days=days;ui.model=model();paintDetail()});buttons.append(btn)}
  horizon.append(buttons);controls.append(horizon);
  const whatIf=el('div',undefined,'bg-w-nav-whatif');whatIf.append(el('span','Wat als je omstandigheden veranderen?'));
  const range=el('input');range.type='range';range.min=-30;range.max=30;range.step=5;range.value=ui.sensitivity;range.disabled=!forecast;
  range.setAttribute('aria-label','Scenarioaanname tussen min dertig en plus dertig procent');
  const out=el('output',undefined,'bg-w-nav-output');
  const update=()=>{const v=model().scenario;out.textContent=v?'Hypothetisch '+(ui.sensitivity>0?'+':'')+ui.sensitivity+'%: '+fmt(v.simulated,m.unit):'Nog geen verantwoorde trend'};
  range.addEventListener('input',()=>{ui.sensitivity=Number(range.value);update()});
  range.addEventListener('change',()=>{ui.model=model();paintDetail()});
  whatIf.append(range,out);
  const presets=el('div',undefined,'bg-w-nav-btns');
  for(const [percent,label] of [[-10,'Tegenvaller'],[0,'Basis'],[10,'Meewind']]){
   const btn=el('button',label);btn.type='button';btn.disabled=!forecast;btn.setAttribute('aria-pressed',String(ui.sensitivity===percent));
   btn.addEventListener('click',()=>{ui.sensitivity=percent;ui.model=model();paintDetail()});presets.append(btn);
  }
  whatIf.append(presets,el('small',forecast?'Deze schuif verandert alleen een aanname, geen echt bedrijfsresultaat.':'Minimaal drie recente meetmomenten over veertien dagen vereist.'));
  controls.append(whatIf);detail.append(controls);update();
  const linked=el('section',undefined,'bg-w-nav-linked');linked.append(el('h4','Welke onderdelen hangen hiermee samen?'));
  const tags=el('div',undefined,'bg-w-nav-tags');ui.model.related.forEach(t=>tags.append(el('span',t)));linked.append(tags);
  linked.append(el('p','Verbanden zijn conceptueel, tenzij een afzonderlijke klantgebonden berekening het effect bewijst.'));detail.append(linked);
  const actions=el('div',undefined,'bg-w-nav-actions');
  for(const [label,page] of [['Bekijk domein',m.page],['Volledig scenario','os:scenario-simulator'],['Controleer bronnen','bronnenbibliotheek'],['Leg actie vast','actieve-acties']]){
   const button=el('button',label+' →');button.type='button';button.addEventListener('click',()=>go(page));actions.append(button);
  }detail.append(actions);
  detail.append(el('p',history.length+' meetmomenten; '+m.evidenceCount+' bronverwijzingen. '+m.note,'bg-w-nav-proof'));
 }
 launch.addEventListener('click',()=>{if(!isAllowed())return;ui.model=model();paintOrbit();paintDetail();dialog.showModal();document.body.classList.add('bg-w-nav-open');orbit.focus({preventScroll:true})});
 closeButton.addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
 document.addEventListener('keydown',e=>{if(dialog.open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close()}},true);
 domainState.subscribe(()=>{if(dialog.open&&isAllowed()){ui.model=model();paintOrbit();paintDetail()}});
 return {close,version:NAVIGATOR_VERSION};
}
