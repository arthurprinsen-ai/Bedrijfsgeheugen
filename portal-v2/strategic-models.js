const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const avg=xs=>xs.length?xs.reduce((s,v)=>s+n(v),0)/xs.length:0;
const esc=v=>String(v??'');

function portal(state){return state?.portal||{}}
function profile(state){return portal(state).profile||{}}
function metrics(state){return portal(state).metrics||{}}
function market(state){return portal(state).market||portal(state).branche||{} }
function maturity(state,key){
 const p=profile(state);const source=p.maturity||p.dimensions||{};
 return n(source[key],2);
}
function maturityAverage(state){
 const p=profile(state);const source=p.maturity||p.dimensions||{};
 const values=Object.values(source).map(Number).filter(Number.isFinite);
 return values.length?avg(values):2;
}
function marketGrowth(state){return n(market(state).growth ?? market(state).groei,0)}
function industryPosition(state){return n(market(state).digitalIntensity ?? market(state).dig,0)}
function strongestWeakest(state){
 const keys=['operatie','commercie','service','finance','mensen','tech','sturing','analytics','quality','culture'];
 const rows=keys.map(id=>({id,value:maturity(state,id)})).sort((a,b)=>a.value-b.value);
 return {weak:rows.slice(0,2),strong:rows.slice(-2).reverse()};
}
function bcgPosition(growth,own,industry){
 const growing=growth>1.5,strong=own>=industry;
 return growing&&strong?'star':!growing&&strong?'cash-cow':growing?'question-mark':'dog';
}

export function buildStrategicModels(state={}){
 const p=profile(state),m=metrics(state),mk=market(state),own=maturityAverage(state),growth=marketGrowth(state),industry=industryPosition(state);const sw=strongestWeakest(state);
 const largest=n(m.largestCustomer),gross=n(m.grossMargin),headcount=n(p.headcount),branch=esc(mk.industry||p.industry||p.branch||'je branche');
 const bcg=bcgPosition(growth,own,industry);
 const common={source:'Canonieke Powerhouse-klantstate',provenance:'portal.*',freshness:portal(state).meta?.freshness||null,confidence:portal(state).meta?.confidence??null};
 const q=[
  {id:'star',title:'Ster',explanation:'Groeiende markt, sterke positie. Investeren zolang de voorsprong rendeert.'},
  {id:'cash-cow',title:'Melkkoe',explanation:'Rustige markt, sterke positie. Hier ontstaat ruimte om andere prioriteiten te financieren.'},
  {id:'question-mark',title:'Vraagteken',explanation:'Groeiende markt, achterstand. Bewust kiezen: investeren om bij te trekken of loslaten.'},
  {id:'dog',title:'Hond',explanation:'Rustige markt, zwakke positie. Alleen behouden als het strategisch of financieel aantoonbaar bijdraagt.'}
 ].map(x=>({...x,active:x.id===bcg}));
 return [
  {id:'swot',title:'SWOT',framework:'klassiek',...common,sections:[['Sterk',sw.strong.map(x=>x.id).join(', ')],['Zwak',sw.weak.map(x=>x.id).join(', ')],['Kans',growth>1.5?`${branch} groeit met ${growth.toFixed(1)}%`:'Groei moet vooral uit productiviteit of marktaandeel komen'],['Bedreiging',largest>=25?`Grootste klant is ${largest}% van de omzet`:'Externe kosten- en loonontwikkeling kan marge raken']]},
  {id:'balanced-scorecard',title:'Balanced Scorecard',framework:'Kaplan & Norton',...common,sections:[['Financieel',gross?`Brutomarge ${gross}%`:'Nog geen brutomarge'],['Klant',`Service niveau ${maturity(state,'service')}`],['Proces',`Operatie niveau ${maturity(state,'operatie')}`],['Leren',`Mensen en kennis niveau ${maturity(state,'mensen')}`]]},
  {id:'seven-s',title:'7S — hard tegen zacht',framework:'McKinsey',...common,metrics:{hard:avg([maturity(state,'tech'),maturity(state,'analytics'),maturity(state,'quality')]),soft:avg([maturity(state,'culture'),maturity(state,'mensen')])}},
  {id:'blue-ocean',title:'Blue Ocean — ERRC',framework:'Kim & Mauborgne',...common,sections:[['Schrappen','Werk of rapportage zonder aantoonbare klant- of stuurwaarde'],['Verminderen','Doorlooptijd, overdrachten en dubbele invoer'],['Verhogen','Voorspelbaarheid, bewijs en transparantie'],['Creëren',maturity(state,'mensen')<3?'Kennis die van het bedrijf wordt in plaats van personen':'Aantoonbare overdraagbaarheid en schaalbaarheid']]},
  {id:'ansoff',title:'Ansoff — waar komt groei vandaan',framework:'Ansoff',...common,sections:[['Bestaande klanten',largest>=25?'Eerst concentratierisico bewaken':'Vaak de goedkoopste groeiroute'],['Nieuwe klanten',growth<1?'Marktaandeel winnen is noodzakelijk':'De markt helpt mee'],['Nieuw aanbod','Vraagt vrije capaciteit en klantbewijs'],['Diversificatie',own>=4?'Basis kan dit dragen':'Eerst de basis verder versterken']]},
  {id:'three-horizons',title:'Drie horizonten',framework:'McKinsey',...common,sections:[['Nu',`Smalste schakel: ${sw.weak[0]?.id||'onbekend'}`],['Straks','Kernprocessen verbinden en gegevens één keer vastleggen'],['Later','Afwijkingen automatisch signaleren, mensen laten beslissen']]},
  {id:'bcg',title:'BCG-matrix',framework:'Boston Consulting Group',...common,position:bcg,metrics:{marketGrowth:growth,ownPosition:own,industryPosition:industry},quadrants:q,explanation:`Twee assen: marktgroei en je eigen positie. ${branch} groeit met ${growth.toFixed(1)}%; je eigen niveau is ${own.toFixed(1)} tegenover ${industry.toFixed(1)} in de branche. Daarom valt de huidige positie in ${q.find(x=>x.active)?.title||'onbekend'}.`},
  {id:'five-forces',title:'Vijf krachten',framework:'Porter',...common,sections:[['Macht klanten',largest?`Grootste klant ${largest}%`:'Klantconcentratie nog niet ingevuld'],['Macht leveranciers',maturity(state,'tech')<3?'Losse systemen vergroten overstapkosten':'Verbonden systemen beperken lock-in'],['Nieuwe toetreders',industry>2.8?'Digitalisering verlaagt toetredingsdrempels':'Vakkennis en netwerk blijven drempels'],['Vervanging','Zelf doen is vaak het belangrijkste alternatief'],['Concurrentie',growth<1?'Lage groei maakt de markt een verdeelspel':'Groei biedt ruimte zonder uitsluitend marktaandeel af te pakken']]},
  {id:'value-chain',title:'Waardeketen',framework:'Porter',...common,sections:['operatie','commercie','service','finance','mensen','tech','sturing'].map(k=>[k,`niveau ${maturity(state,k)}`])},
  {id:'destep',title:'DESTEP',framework:'omgevingsanalyse',...common,sections:[['Demografisch',maturity(state,'mensen')<3?'Krapte en vertrek wegen extra zwaar wanneer kennis in hoofden zit':'Kennisborging dempt verlooprisico'],['Economisch',`Marktgroei ${growth.toFixed(1)}%`],['Sociaal','Flexibiliteit en snelle respons zijn basisverwachtingen'],['Technologisch',`Systemen en AI niveau ${maturity(state,'tech')}`],['Ecologisch','Gebruik CSRD & Impact voor materiële footprint'],['Politiek-juridisch','Gebruik het actuele regelgevingsregister en compliance-command-center']]},
  {id:'value-proposition',title:'Waardepropositie',framework:'Osterwalder',...common,sections:[['Klanttaak','Werk af krijgen zonder onnodige overdracht'],['Pijn',maturity(state,'service')<3?'Vragen en status zitten verspreid':'Geen structurele service-achterstand zichtbaar'],['Pijnverzachter',`Pak eerst ${sw.weak[0]?.id||'de smalste schakel'} aan`],['Winst','Meer zekerheid over prijs, datum, status en resultaat']]},
  {id:'pdca-dmaic',title:'Verbetercyclus',framework:'PDCA · DMAIC',...common,sections:[['Cyclus','Plan → doe → meet → stel bij'],['Borging','Definieer → meet → analyseer → verbeter → borg']]},
  {id:'rice-moscow',title:'Prioriteren',framework:'RICE · MoSCoW',...common,sections:[['RICE','Bereik × effect × zekerheid ÷ moeite'],['MoSCoW','Moet · hoort · mag · later']]},
  {id:'value-disciplines',title:'Waar win je op?',framework:'Treacy & Wiersema',...common,sections:[['Prijs',`Operatie niveau ${maturity(state,'operatie')}`],['Product','Vraagt ruimte om te ontwikkelen'],['Klantrelatie',`Mensen en kennis niveau ${maturity(state,'mensen')}`]]},
  {id:'kano',title:'Wat klanten waarderen',framework:'Kano',...common,sections:[['Vanzelfsprekend','Basisafspraken moeten altijd kloppen'],['Prestatie','Snellere reactie en kortere doorlooptijd tellen lineair mee'],['Verrassing','Proactief signaleren creëert extra ervaren waarde']]}
 ];
}
