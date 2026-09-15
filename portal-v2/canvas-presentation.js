const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const pct=v=>`${n(v).toFixed(0)}%`;
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n(v));
function portal(state){return state?.portal||{}}
function profile(state){return portal(state).profile||{}}
function metrics(state){return portal(state).metrics||{}}
function level(state,key){const p=profile(state);return n((p.maturity||p.dimensions||{})[key],2)}
function answer(state,id){return String(portal(state).canvases?.[id]?.answer||'')}
function owner(state,id){return String(portal(state).canvases?.[id]?.owner||'')}
function branch(state){return portal(state).market?.industry||profile(state).industry||profile(state).branch||'de gekozen branche'}
function weakest(state){const ids=['operatie','commercie','service','finance','mensen','tech','sturing','analytics','quality','culture'];return ids.map(id=>({id,v:level(state,id)})).sort((a,b)=>a.v-b.v)[0]?.id||'onbekend'}
function annualManualCost(state){const p=profile(state);return n(p.manualHoursPerWeek)*46*n(p.hourlyCost)}

export const CANVAS_SPECS=Object.freeze([
 {id:'bmc',title:'Business Model Canvas',prompt:'Welke klantgroep levert de meeste waarde én verdient de meeste aandacht?'},
 {id:'vpc2',title:'Waardepropositiecanvas',prompt:'Wat zegt je beste klant dat hij aan jullie heeft, in zijn eigen woorden?'},
 {id:'lean',title:'Lean Canvas',prompt:'Welk probleem zou je oplossen als je dit jaar maar één ding mocht aanpakken?'},
 {id:'merk',title:'Merkcanvas',prompt:'Waarop kiezen klanten jullie aantoonbaar in plaats van de concurrent?'},
 {id:'content',title:'Contentcanvas',prompt:'Welke vraag krijg je van klanten het vaakst voordat zij besluiten?'},
 {id:'sales2',title:'Salescanvas',prompt:'Welke doelgroep, opening en opvolging leveren aantoonbaar goede gesprekken op?'}
]);

function sectionsFor(id,state){
 const p=profile(state),m=metrics(state),head=n(p.headcount),rev=n(m.revenue)*1000,largest=n(m.largestCustomer),cost=annualManualCost(state),weak=weakest(state),industry=branch(state);
 const perEmployee=head&&rev?eur(rev/head):'Nog niet berekenbaar';
 const map={
  bmc:[['Klantsegmenten',answer(state,'bmc')||industry],['Waardepropositie',`Maak ${weak} aantoonbaar eenvoudiger en voorspelbaarder`],['Kanalen','Website, relaties, sales en bestaande klantcontacten'],['Klantrelaties',largest>=25?`Concentratierisico: grootste klant ${pct(largest)}`:'Relatiebasis is niet sterk geconcentreerd'],['Inkomstenstromen',rev?`${eur(rev)} omzet uit huidige bedrijfsdata`:'Omzet nog niet ingevuld'],['Kernmiddelen',`${head||'Onbekend aantal'} medewerkers, kennis, systemen en data; zwakste schakel ${weak}`],['Kernactiviteiten','Leveren, opvolgen, verbeteren en kennis borgen'],['Partners','Leveranciers en platforms die kritieke processen ondersteunen'],['Kostenstructuur',cost?`${eur(cost)} berekend handwerk per jaar`:'Handwerkkosten nog niet berekenbaar']],
  vpc2:[['Klanttaken','Werk af krijgen zonder dubbel werk, onduidelijke status of onnodige overdracht'],['Pijnpunten',`De laagste volwassenheid zit bij ${weak}`],['Gewenste winst','Zekerheid over voortgang, kwaliteit en resultaat'],['Pijnverzachters',`Maak informatie en verantwoordelijkheden rond ${weak} expliciet`],['Winstmakers',answer(state,'vpc2')||'Vul de woorden van je beste klant in'],['Bewijs',perEmployee==='Nog niet berekenbaar'?'Nog te onderbouwen met eigen cijfers':`Omzet per medewerker ${perEmployee}`]],
  lean:[['Probleem',answer(state,'lean')||`De belangrijkste structurele rem ligt bij ${weak}`],['Klantsegment',industry],['Unieke waarde','Concrete verbetering met herleidbare cijfers, eigenaar en bewijs'],['Oplossing',`Begin klein bij ${weak}, meet vóór en na, schaal pas na bewijs`],['Kanalen','Bestaande klantkanalen en gerichte acquisitie'],['Inkomsten','Waarde uit gerealiseerde verbetering, niet uit activiteit alleen'],['Kosten',cost?`${eur(cost)} huidig berekend handwerk`:'Nog geen complete kostenbasis'],['Kernmetingen','Doorlooptijd, fout, handwerk, conversie, gerealiseerde waarde'],['Oneerlijk voordeel',level(state,'mensen')>=3?'Geborgde bedrijfsspecifieke kennis en historie':'Nog geen moeilijk kopieerbaar voordeel bewezen']],
  merk:[['Waar je voor staat',answer(state,'merk')||'Maak expliciet wat klanten over jullie moeten zeggen als jullie er niet bij zijn'],['Voor wie',industry],['De vijand',level(state,'tech')<3?'Grote systeemprojecten zonder aantoonbaar resultaat':'Stilstand en optimaliseren zonder meetbaar effect'],['Belofte','Verbetering die werkt én aantoonbaar is'],['Bewijs',perEmployee],['Toon','Concreet, begrijpelijk, bewijsgericht en zonder overdrijving']],
  content:[['Doel','Gesprekken en vertrouwen opbouwen bij de juiste doelgroep'],['Doelgroep',`${industry}; context ${head||'onbekend'} medewerkers`],['Kernvraag',answer(state,'content')||'Welke operationele of bestuurlijke vraag krijgt prioriteit?'],['Pijlers',`Eigen expertise × klantprobleem × bewijs uit ${weak} en andere bedrijfssignalen`],['Ritme','Kwaliteit en relevantie boven volume'],['Bewijs','Gebruik eigen cijfers, bronvermelding, freshness en confidence waar relevant']],
  sales2:[['Doelgroep',answer(state,'sales2')||industry],['Probleemhaak',`Begin bij een herkenbare pijn rond ${weak}, niet bij het aanbod`],['Opening','Situatie → gevolg → vraag; geen productpitch zonder context'],['Cadans','Beperkte, relevante opvolging met contactdrukbewaking'],['Metriek','Replies → meetings → proposals → wins/losses → gerealiseerde omzet'],['Opvolging',level(state,'commercie')<3?'Opvolging vraagt extra borging; commercie is nog niet volwassen genoeg':'Commerciële opvolging is relatief goed ingericht'],['Risico',largest>=25?`Spreiding eerst: grootste klant ${pct(largest)}`:'Geen hoog klantconcentratierisico uit huidige invoer']]
 };
 return (map[id]||[]).map(([label,value])=>({label,value}));
}

export function buildCanvasPresentation(state={}){
 const canvases=CANVAS_SPECS.map(spec=>({...spec,owner:owner(state,spec.id),answer:answer(state,spec.id),sections:sectionsFor(spec.id,state)}));
 const answered=canvases.filter(c=>c.answer.trim().length>2).length;
 const remaining=canvases.filter(c=>c.answer.trim().length<=2).map(c=>c.title);
 let text;
 if(answered===0) text='De zes canvassen zijn vanuit je bedrijfsdata gevuld, maar zonder jouw zes eigen antwoorden is dit nog een modelprojectie en geen complete conclusie.';
 else if(answered<2) text=`${answered} van de 6 canvasvragen is beantwoord. Vul minimaal nog één eigen antwoord in voordat een samenhangende conclusie verantwoord is.`;
 else text=`${answered} van de 6 canvasvragen zijn beantwoord. De data en je eigen antwoorden wijzen eerst naar ${weakest(state)}; gebruik dat als hypothese en toets hem aan de acties en outcomes.`;
 return {canvases,completion:{answered,total:6,remaining},conclusion:{text,source:'canonieke Powerhouse-state + klantinvoer',confidence:answered/6}};
}
