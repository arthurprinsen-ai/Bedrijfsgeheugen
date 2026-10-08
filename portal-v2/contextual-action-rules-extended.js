import {BUSINESS_STAGES,STRATEGIC_EVENTS} from '../brain/context/business-context-engine.mjs';

// Read-only tenant context → explainable recommendations, not verified outcomes.
const get=(root,path)=>String(path).split('.').reduce((v,k)=>v==null?undefined:v[k],root);
const has=v=>v!==undefined&&v!==null&&v!==''&&!(typeof v==='number'&&!Number.isFinite(v));
const num=v=>has(v)&&Number.isFinite(Number(v))?Number(v):null;
const rows=v=>Array.isArray(v)?v:[];
const slug=v=>String(v??'unknown').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'unknown';
const PROFILE=['profiel','overzicht','businesscase','data-ai','mensen','advies','roadmap'];
const CUSTOMER=['cijfers-maatstaven','branche-markt','overzicht','businesscase','advies','roadmap'];
const OPERATION=['cijfers-maatstaven','businesscase','ai-scan','advies','roadmap','taken-werkstromen'];
const GOVERNANCE=['compliance-governance','csrd-impact','due-diligence','onderzoek','advies','roadmap'];
const RISK=['due-diligence','waarde-financiering','exit','audit','advies','roadmap'];
const DELIVERY=['wijzigingen','taken-werkstromen','actieve-acties','roadmap','advies','outcomes-evidence'];
const AI=['ai-scan','data-ai','ai-capabilities','compliance-governance','businesscase','advies','roadmap'];
const MARKET=['branche-markt','onderzoek','businesscase','advies','roadmap'];

export function appendBroaderContextualActions(state={},cards=[],{card,item,today='2026-10-08'}={}){
 if(typeof card!=='function'||typeof item!=='function')throw new TypeError('ACTION_CARD_FACTORIES_REQUIRED');
 const put=(...parts)=>item(cards,card(...parts));
 const maturity=get(state,'portal.profile.maturity')||{};
 const levels=Object.entries(maturity).map(([k,v])=>({key:k,value:num(v)})).filter(x=>x.value!==null&&x.value>=1&&x.value<=2).sort((a,b)=>a.value-b.value);
 for(const entry of levels.slice(0,4))put('maturity-'+slug(entry.key),'Volwassenheid in '+entry.key+' beoordelen',entry.value===1?'P1':'P2','portal.profile.maturity.'+entry.key,entry.value,
   'Zelfbeoordeling '+entry.value+'/5. Onderzoek oorzaken en afhankelijkheden; dit is geen gemeten besparing.',
   'Bepaal een meetbaar verbeterdoel, eigenaar en gevalideerd financieel scenario.',PROFILE);
 const people=get(state,'portal.people')||{};
 const turnover=num(people.turnover);
 if(turnover!==null&&turnover>20)put('people-turnover','Personeelsverloop en continuïteit','P2','portal.people.turnover',turnover,
  'Ingevuld verloop '+turnover+'%; 20% is een attentiewaarde, geen sectornorm.',
  'Bepaal uitstroomoorzaken, kennisrisico, vervangingskosten en behoudmaatregelen.',['mensen',...PROFILE,'due-diligence']);
 const vulnerable=rows(people.roles).filter(r=>has(r?.criticalKnowledge)&&!has(r?.backup));
 if(vulnerable.length)put('knowledge-backup','Kritieke kennis zonder vervanging','P1','portal.people.roles',vulnerable.length,
  vulnerable.length+' ingevoerde rollen hebben kritieke kennis zonder vastgelegde back-up.',
  'Wijs vervangers toe, leg instructies vast en test continuïteit.',['mensen','documenten','herstel-continuiteit','due-diligence','roadmap','taken-werkstromen']);
 const metrics=get(state,'portal.metrics')||{};
 const revenue=num(metrics.revenue),ebitda=num(metrics.ebitda);
 if(ebitda!==null&&ebitda<0)put('negative-ebitda','Operationeel resultaat negatief','P1','portal.metrics.ebitda',ebitda,
  'Ingevulde EBITDA is negatief (in € × 1.000); verklaar trend, periode en liquiditeit.',
  'Valideer cijfers en maak een marge-/kasstroomscenario.',['cijfers-maatstaven','waarde-financiering','businesscase','herstel-continuiteit','advies','roadmap']);
 else if(revenue!==null&&revenue>0&&ebitda!==null&&ebitda/revenue*100<3)put('low-ebitda-margin','Lage EBITDA-marge nader onderzoeken','P2','portal.metrics.ebitda',ebitda,
  'De berekende EBITDA-marge uit klantinvoer is '+(100*ebitda/revenue).toFixed(1)+'%. 3% is een attentiewaarde, geen sectorbenchmark.',
  'Vergelijk met historie en sectorbron; onderzoek product- en klantbijdrage.',CUSTOMER);
 const gross=num(metrics.grossMargin);
 if(gross!==null&&gross<0)put('negative-gross-margin','Negatieve brutomarge onderzoeken','P1','portal.metrics.grossMargin',gross,
  'De ingevoerde brutomarge is negatief. Controleer datadefinitie en kostentoewijzing.',
  'Herbereken bijdrage per product/dienst met gevalideerde gegevens.',CUSTOMER);
 const nps=num(metrics.nps);
 if(nps!==null&&nps<0)put('negative-customer-nps','Negatieve klant-NPS beoordelen','P2','portal.metrics.nps',nps,
  'De ingevulde NPS is negatief. Steekproef, trend en segmenten bepalen de impact.',
  'Onderzoek klachten en kies een meetbare klantverbeteractie.',CUSTOMER);
 const satisfaction=num(metrics.satisfaction);
 if(satisfaction!==null&&satisfaction<=6)put('customer-satisfaction','Klanttevredenheid vraagt opvolging','P2','portal.metrics.satisfaction',satisfaction,
  'Klanttevredenheid is '+satisfaction+'/10 volgens de invoer; sector- en klantcontext zijn nog vereist.',
  'Analyseer serviceoorzaken, klantgroepen en verloop.',CUSTOMER);
 const ops=metrics.performance||{};
 const defects=num(ops.defects);
 if(defects!==null&&defects>5)put('operational-defects','Fouten in de uitvoering analyseren','P2','portal.metrics.performance.defects',defects,
  'Foutpercentage '+defects+'%; 5% is een signaleringsgrens, geen sectorbenchmark.',
  'Onderzoek faalkosten en oorzaken vóór berekening van baten.',OPERATION);
 const onTime=num(ops.onTime);
 if(onTime!==null&&onTime<90)put('delivery-reliability','Leverbetrouwbaarheid vraagt verbetering','P2','portal.metrics.performance.onTime',onTime,
  'Op tijd geleverd '+onTime+'%; 90% is een attentiewaarde, niet automatisch de SLA.',
  'Toets contracten, klantimpact en de oorzaken van vertraging.',OPERATION);
 const churn=num(ops.churn);
 if(churn!==null&&churn>15)put('customer-churn','Klantverloop nader onderzoeken','P2','portal.metrics.performance.churn',churn,
  'Klantverloop '+churn+'%; meetperiode en sectorvergelijking moeten worden bevestigd.',
  'Analyseer cohortbehoud en kwantificeer met echte contractgegevens.',CUSTOMER);
 const conversion=num(ops.quoteConversion);
 if(conversion!==null&&conversion<10)put('quote-conversion','Offerteconversie beoordelen','P2','portal.metrics.performance.quoteConversion',conversion,
  'Offerteconversie '+conversion+'%; 10% is uitsluitend een attentiewaarde.',
  'Onderzoek verloren deals, klantrelevantie en verkoopproces.',CUSTOMER);
 const scan=get(state,'portal.aiScan')||{},rate=num(scan.hourlyRate);
 for(const [index,task] of rows(scan.tasks).entries()){
  if(!task||typeof task!=='object'||!has(task.task))continue;
  const hours=num(task.hoursPerWeek),ready=num(task.dataReadiness),errors=num(task.errorRisk);
  if(!(errors!==null&&errors>=4||hours!==null&&hours>=5&&ready!==null&&ready<=2))continue;
  const potential=hours!==null&&hours>0&&rate!==null&&rate>0?Math.round(hours*46*rate):null;
  const scenario=potential===null?undefined:{financialImpact:Object.freeze({status:'SCENARIO_ONLY',amount:potential,unit:'EUR_PER_YEAR',label:'Ingevoerde jaarlijkse taakkosten bij 46 werkweken',reason:'Indicatieve taakkosten, niet een volledig bespaarbaar bedrag of bewezen opbrengst.'})};
  put('ai-task-'+slug(task.id||task.task),'AI-kans en risico per taak beoordelen',errors!==null&&errors>=5?'P1':'P2','portal.aiScan.tasks',index,
   'Taak heeft '+(errors!==null?'foutrisico '+errors+'/5':'onbekend foutrisico')+' en '+(ready!==null?'datagereedheid '+ready+'/5':'onbekende datagereedheid')+'.',
   'Toets datakwaliteit, menselijke controle en technische haalbaarheid vóór automatisering.',AI,scenario||{});
  if(index>=14)break;
 }
 const esg=get(state,'portal.compliance.esg')||{};
 const noEvidence=Object.values(esg).filter(v=>String(v)==='0').length;
 if(noEvidence)put('esg-source-gaps','Ontbrekende ESG-brongegevens opvolgen','P2','portal.compliance.esg',noEvidence,
  noEvidence+' duurzaamheidsonderwerpen zijn als zonder gegevens gemarkeerd. Dat bewijst geen wettelijke CSRD-plicht.',
  'Toets sector, omvang, toepasselijkheid, bron, eigenaar en meetperiode.',GOVERNANCE);
 for(const [i,b] of rows(get(state,'portal.market.benchmarks')).entries()){
  const own=num(b?.company),ref=num(b?.benchmark);
  if(own===null||ref===null||ref===0||!has(b?.metric))continue;
  const diff=Math.abs((own-ref)/ref)*100;
  if(diff<20)continue;
  put('market-gap-'+slug(b.metric),'Benchmarkverschil '+String(b.metric).slice(0,70)+' beoordelen','P2','portal.market.benchmarks',i,
   'Afwijking '+Math.round(diff)+'% t.o.v. ingevoerde referentie. Richting, definitie en brondatum zijn nog te toetsen.',
   'Valideer de benchmarkbron en bepaal daarna een actie.',MARKET);
  if(i>=8)break;
 }
 for(const [index,f] of rows(get(state,'portal.research.hypotheses')).entries()){
  const confidence=num(f?.confidence);
  if(confidence===null||confidence>2||!has(f?.hypothesis))continue;
  put('hypothesis-evidence-'+slug(f.id||f.hypothesis),'Strategische aanname vraagt bewijs','P2','portal.research.hypotheses',index,
   'Onderzoekshypothese heeft zekerheidsniveau '+confidence+'/5; geen onafhankelijk bevestigd bedrijfsfeit.',
   'Toets met betrouwbare data of een afgebakend experiment.',MARKET);
  if(index>=8)break;
 }
 for(const [i,f] of rows(get(state,'portal.dueDiligence.findings')).entries()){
  if(!f||typeof f!=='object')continue;
  const materiality=num(f.materiality),red=f.redFlag===true;
  if(!red&&!(materiality!==null&&materiality>=4))continue;
  put('due-diligence-'+slug(f.id||String(f.area||'')+'-'+String(f.finding||'')),red?'Due-diligence red flag opvolgen':'Materiële due-diligencebevinding opvolgen',red?'P1':'P2','portal.dueDiligence.findings',i,
   'Invoer is aangeduid als '+(red?'red flag':'materieel '+materiality+'/5')+'. Gevolgen zijn niet onafhankelijk bewezen.',
   'Verzamel bewijs, eigenaar en oplossingskosten, toets gevolgen voor waardering.',RISK);
  if(i>=8)break;
 }
 const context=get(state,'portal.business_context')||{};
 const stage=BUSINESS_STAGES[String(context.stage||'')];
 if(stage&&['crisis','loss','stagnate'].includes(stage.id))put('business-stage-'+stage.id,'Bedrijfsfase '+stage.label+' vraagt scenario',stage.id==='crisis'?'P1':'P2','portal.business_context.stage',stage.id,
  'De klant heeft deze fase gekozen. Liquiditeit, risico en context vragen aparte verificatie.',
  'Prioriteer kasstroom-, markt- en continuïteitsscenario’s met eigenaar.',['bedrijfssituatie',...stage.pages,'advies','roadmap']);
 for(const event of rows(context.events)){
  const def=STRATEGIC_EVENTS[String(event)];
  if(!def)continue;
  put('strategic-event-'+def.id,def.label+': impact beoordelen','P2','portal.business_context.events',def.id,
   'De klant heeft deze gebeurtenis geselecteerd; impact op bedrijfswaarde, mensen, processen en regelgeving moet worden bepaald.',
   'Maak relevante due-diligence-, financierings- en uitvoeringsacties met bewijs.',['bedrijfssituatie',...def.pages,'advies','roadmap']);
 }
 for(const [index,change] of rows(get(state,'portal.changes.items')).entries()){
  const level=num(change?.impact),status=String(change?.status||'Open');
  if(level===null||level<4||['Geborgd','Afgerond','Klaar'].includes(status))continue;
  put('change-'+slug(change.id||change.change),'Belangrijke bedrijfswijziging opvolgen',level===5?'P1':'P2','portal.changes.items',index,
   'Wijziging heeft zelfgerapporteerde impact '+level+'/5 en is nog niet geborgd.',
   'Beoordeel capaciteit, systemen, financiële gevolgen, eigenaar en afhankelijkheden.',DELIVERY);
 }
 const now=Date.parse(String(today).slice(0,10)+'T00:00:00Z');
 for(const [index,task] of rows(get(state,'portal.tasks.items')).entries()){
  const done=['Klaar','Afgerond','Completed'].includes(String(task?.status||''))||task?.done===true;
  if(done)continue;
  const blocked=String(task?.status||'')==='Geblokkeerd';
  const due=typeof task?.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(task.due)?Date.parse(task.due+'T00:00:00Z'):NaN;
  if(!blocked&&!(Number.isFinite(due)&&Number.isFinite(now)&&due<now))continue;
  put('task-'+slug(task.id||task.title),blocked?'Geblokkeerde taak vraagt besluit':'Achterstallige actie opvolgen',blocked?'P1':'P2','portal.tasks.items',index,
   blocked?'Taak is als geblokkeerd vastgelegd.':'Vastgelegde deadline ligt vóór de peildatum zonder afgeronde status.',
   'Wijs blokkade en eigenaar toe, bepaal afhankelijkheden en herstel planning.',DELIVERY);
  if(index>=12)break;
 }
 return cards;
}
