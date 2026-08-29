export const company = { name:'Asteriq Groep', health:82, delta:3, lastSync:'Vandaag 19:42', verifiedCoverage:91, potentialValue:47000 };
export const today = {
  summary:'Sinds gisteren zijn 27 relevante veranderingen verwerkt. Twee vragen om aandacht. De marge van Product B loopt achter op plan; tegelijk ontstaat er een commerciële kans in Segment Industrie.',
  metrics:[
    {label:'Besluiten nodig',value:'3',tone:'attention'},{label:'Acties aandacht',value:'7',tone:'attention'},{label:'Nieuwe risico’s',value:'2',tone:'risk'},{label:'Kansen gevonden',value:'5',tone:'good'},{label:'Potentiële waarde',value:'€47K',tone:'good'}
  ],
  priorities:[
    {id:'decision-margin',kind:'Beslis nu',title:'Marge Product B herstellen',text:'Inkoopkosten +11%, prijs 14 maanden ongewijzigd. Scenario +4% geeft naar verwachting €161K netto marge-impact.',meta:['Impact hoog','Confidence 86%','Eigenaar Directie'],action:'Open besluit',tone:'risk'},
    {id:'action-onboarding',kind:'Doe nu',title:'Onboarding-stap loopt achter',text:'Drie open acties blokkeren de geplande livegang. Eén eigenaar ontbreekt en kan daarom niet actief worden.',meta:['Deadline 2 sep','3 afhankelijkheden','Evidence 7'],action:'Bekijk acties',tone:'attention'},
    {id:'opp-invoice',kind:'Kans',title:'€72K besparing in factuurcontrole',text:'37% van handmatige controles valideert informatie die al betrouwbaar uit het ERP beschikbaar is.',meta:['Payback 1,4 mnd','Confidence 89%','Finance'],action:'Bekijk businesscase',tone:'good'},
    {id:'risk-law',kind:'Risico',title:'Nieuwe AI-governanceverplichting raakt 4 processen',text:'De wijziging raakt HR, Marketing, Data en Customer Service. Impactanalyse is voorbereid.',meta:['Impact hoog','4 processen','Approval nodig'],action:'Open impact',tone:'risk'}
  ]
};
export const healthDomains=[['Strategie',86,2],['Commercie',74,-3],['Klanten',83,1],['Organisatie',79,0],['Processen',76,2],['Technologie',88,4],['Data',81,3],['Finance',84,1],['Risk & compliance',78,-1],['Kennis',90,5]];
export const intelligenceSignals=[
  {id:'sig-ai-act',category:'Wetgeving',title:'AI-governanceverplichting aangescherpt',source:'EU-regelgeving',status:'Recommend',confidence:94,impact:'Hoog',affected:['HR','Marketing','Data','Customer Service'],summary:'Vier interne processen gebruiken AI-context die opnieuw tegen de governance-policy moet worden gevalideerd.'},
  {id:'sig-market',category:'Markt',title:'Concurrenten verhogen tarieven gemiddeld 5–7%',source:'Marktscan',status:'Prioritise',confidence:81,impact:'Midden',affected:['Pricing','Sales','Product B'],summary:'De marktbeweging vergroot de ruimte voor een gecontroleerde prijswijziging zonder grote churn-indicatie.'},
  {id:'sig-tech',category:'Technologie',title:'Nieuwe API-mogelijkheid verlaagt synchronisatiekosten',source:'Technology watch',status:'Impact',confidence:88,impact:'Midden',affected:['Integraties','Data','Kosten'],summary:'Event-driven delta sync kan drie polling-jobs vervangen en de dagelijkse operations verlagen.'}
];
export const decisions=[
  {id:'D-284',stage:'Te besluiten',title:'Prijs Product B +4%',why:'Marge daalt 3,8% door stijgende inkoopkosten.',expected:'+€161K netto marge',confidence:86,risk:'Midden',owner:'Directie',options:['0%: marge blijft dalen','+4%: aanbevolen','+7%: meer marge, hoger churnrisico']},
  {id:'D-279',stage:'In voorbereiding',title:'Automatiseer factuurcontrole',why:'37% controles zijn redundant.',expected:'€72K/jaar besparing',confidence:89,risk:'Laag',owner:'Finance',options:['Huidig proces','Hybride controle','Volledig automatiseren']},
  {id:'D-261',stage:'Evalueren',title:'Nieuwe leadrouting',why:'Sneller opvolgen van warme leads.',expected:'+18% snellere opvolging',confidence:91,risk:'Laag',owner:'Sales',options:['Evaluatie na 90 dagen']}
];
export const actions=[
  {id:'A-512',title:'Prijswijziging voorbereiden',owner:'Sanne',status:'Active',executed:false,verified:false,result:null,due:'2 sep',source:'D-284'},
  {id:'A-498',title:'Nieuwe ERP-validatieregel testen',owner:'Milan',status:'Verification',executed:true,verified:false,result:null,due:'30 aug',source:'D-279'},
  {id:'A-476',title:'Leadroutering productiecheck',owner:'Fatima',status:'Done',executed:true,verified:true,result:'+18% snellere opvolging',due:'Afgerond',source:'D-261'},
  {id:'A-520',title:'Onboarding eigenaar toewijzen',owner:'',status:'Blocked',executed:false,verified:false,result:null,due:'Vandaag',source:'Process P-14'}
];
export const valueItems=[
  {label:'Leadroutering',amount:23000,stage:'Realised',verified:true,type:'Revenue gained'},
  {label:'Cloudoptimalisatie',amount:18500,stage:'Realised',verified:true,type:'Cost saved'},
  {label:'Factuurcontrole',amount:72400,stage:'Validated',verified:false,type:'Cost saved'},
  {label:'Prijs Product B',amount:161000,stage:'Approved',verified:false,type:'Revenue gained'},
  {label:'Contractrisico',amount:42000,stage:'Realised',verified:true,type:'Risk avoided'}
];
export const memories=[
  {type:'Besluit',title:'Waarom gebruiken we het huidige CRM?',excerpt:'Gekozen vanwege integratie met finance, salesproces en bestaande klantdata.',evidence:5,date:'12 mrt 2025'},
  {type:'Lesson',title:'Prijswijzigingen altijd contractueel segmenteren',excerpt:'Generieke verhoging gaf onnodige uitzonderingen; segmentatie verhoogde uitvoerbaarheid.',evidence:4,date:'8 jan 2026'},
  {type:'Change',title:'Delta-sync verving volledige nachtimport',excerpt:'API-calls -68%, doorlooptijd -41%, geen kwaliteitsverlies gemeten.',evidence:9,date:'21 aug 2026'}
];
export const agents=[['Observer','Ziet interne en externe veranderingen','Actief'],['Analyst','Zoekt oorzaken, patronen, risico’s en kansen','Actief'],['Advisor','Maakt scenario’s en onderbouwde adviezen','Actief'],['Operator','Voert toegestane wijzigingen uit','Approval'],['Guardian','Controleert werking, security en regressies','Actief'],['Optimizer','Verlaagt kosten en verbetert performance','Actief'],['Librarian','Borgt evidence, besluiten en lessons','Actief']];
export const audit=[['19:42','Guardian','Productieverificatie leadroutering','Verified'],['19:31','Optimizer','Delta-sync voorstel aangemaakt','Review'],['18:55','Librarian','Learning LR-198 opgeslagen','Verified'],['18:21','Observer','Marktsignaal SIG-309 gevalideerd','Verified']];
