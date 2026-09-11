export const DEMO_USER=Object.freeze({email:'demo@bedrijfsgeheugen.nl',name:'Sanne de Vries',user_metadata:Object.freeze({full_name:'Sanne de Vries'}),app_metadata:Object.freeze({role:'Projecteigenaar'})});

const sprints=[
 {id:'s1',name:'Sprint 1 – Analyse & ontwerp',status:'Gereed',progress:100,stories:[{id:'us1',title:'Inventariseer databronnen en processen',status:'Gereed',points:5},{id:'us2',title:'Ontwerp managementcockpit',status:'Gereed',points:8},{id:'us3',title:'Leg KPI-definities vast',status:'Gereed',points:5}]},
 {id:'s2',name:'Sprint 2 – Datafundament',status:'Gereed',progress:100,stories:[{id:'us4',title:'Bouw AFAS-extractie',status:'Gereed',points:8},{id:'us5',title:'Maak canoniek datamodel',status:'Gereed',points:8},{id:'us6',title:'Voeg datakwaliteitschecks toe',status:'Gereed',points:5}]},
 {id:'s3',name:'Sprint 3 – Portaal & dashboards',status:'Actief',progress:72,stories:[{id:'us7',title:'Maak projectcockpit voor management',status:'Testen',points:8},{id:'us8',title:'Maak klant- en marketingdashboard',status:'In uitvoering',points:8},{id:'us9',title:'Maak mobiele projectnavigatie',status:'Testen',points:5}]},
 {id:'s4',name:'Sprint 4 – Integraties & automatisering',status:'Actief',progress:48,stories:[{id:'us10',title:'Synchroniseer CRM-mutaties',status:'In uitvoering',points:8},{id:'us11',title:'Monitor webhooks en herstel fouten',status:'In uitvoering',points:5},{id:'us12',title:'Automatiseer managementrapportage',status:'Te doen',points:8}]},
 {id:'s5',name:'Sprint 5 – Adoptie & overdracht',status:'Gepland',progress:0,stories:[{id:'us13',title:'Acceptatiesessie met key users',status:'Gepland',points:5},{id:'us14',title:'Beheerhandleiding en overdracht',status:'Gepland',points:5}]}
];
const components=[
 {id:'c1',title:'Bedrijfsscan & solution design',description:'Bronnen, processen, KPI’s, architectuur en implementatieplan.',price:3900,duration:'2 weken',optional:false,sprints:[sprints[0]],stories:sprints[0].stories},
 {id:'c2',title:'Datafundament & Power BI',description:'Datamodel, pipelines, kwaliteit, security en beheer.',price:8900,duration:'3 weken',optional:false,sprints:[sprints[1]],stories:sprints[1].stories},
 {id:'c3',title:'Klantportaal V2',description:'Projectcockpit, offerte, planning, documenten, taken en samenwerking.',price:4800,duration:'3 weken',optional:false,sprints:[sprints[2]],stories:sprints[2].stories},
 {id:'c4',title:'Koppelingen & automatisering',description:'AFAS, Microsoft 365, CRM API, webhooks en monitoring.',price:4200,duration:'2 weken',optional:false,sprints:[sprints[3]],stories:sprints[3].stories},
 {id:'c5',title:'Adoptie, training & overdracht',description:'Acceptatie, training, beheerafspraken en overdracht.',price:3000,duration:'2 weken',optional:false,sprints:[sprints[4]],stories:sprints[4].stories}
];
const roadmap=[
 {id:'r1',title:'Kick-off & bronneninventarisatie',period:'Week 1',status:'Gereed'},
 {id:'r2',title:'Solution design akkoord',period:'Week 2',status:'Gereed'},
 {id:'r3',title:'Datafundament productiegeschikt',period:'Week 5',status:'Gereed'},
 {id:'r4',title:'Portaal & dashboards acceptatie',period:'Week 8',status:'Actief'},
 {id:'r5',title:'Integraties productieschakeling',period:'Week 10',status:'Gepland'},
 {id:'r6',title:'Overdracht & beheer',period:'Week 12',status:'Gepland'}
];
const tasks=[
 {id:'t1',title:'AFAS-testdata valideren',status:'Vandaag',owner:'Noor Bakker'},
 {id:'t2',title:'CRM OAuth-productieaccount koppelen',status:'Deze week',owner:'Milan Jansen'},
 {id:'t3',title:'Dashboard-KPI’s accepteren',status:'Open',owner:'Sanne de Vries'},
 {id:'t4',title:'Acceptatiesessie voorbereiden',status:'Gepland',owner:'Eva Meijer'},
 {id:'t5',title:'Beheerhandleiding afronden',status:'Backlog',owner:'Noor Bakker'},
 {id:'t6',title:'Security-readback uitvoeren',status:'Deze week',owner:'Milan Jansen'}
];
const docs=[
 {name:'Offerte OFF-2026-041',type:'PDF',status:'Akkoord'},
 {name:'Functioneel ontwerp v1.3',type:'PDF',status:'Actueel'},
 {name:'AFAS–Power BI mapping',type:'XLSX',status:'Actueel'},
 {name:'Acceptatie- en testplan',type:'DOCX',status:'Concept'},
 {name:'Architectuurplaat',type:'PDF',status:'Actueel'},
 {name:'Beheerafspraken',type:'DOCX',status:'In bewerking'}
];
const integrations=[
 {id:'afas',name:'AFAS',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:42'},
 {id:'m365',name:'Microsoft 365',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:31'},
 {id:'powerbi',name:'Power BI',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:39'},
 {id:'crm',name:'CRM API',status:'Testomgeving',health:'Aandacht',lastSync:'Vandaag 13:58'},
 {id:'webhook',name:'Webhook monitoring',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:45'}
];

export const DEMO_PORTAL_STATE=Object.freeze({
 company:{name:'Noordwind Services B.V. — Demo',naam:'Noordwind Services B.V. — Demo',portalBrand:{name:'Noordwind Services B.V. — Demo'},sector:'Zakelijke dienstverlening',employees:64},
 user:{role:'Projecteigenaar'},
 portal:{
  project:{name:'Digitalisering, data & klantportaal 2026',phase:'Bouwen & koppelen',status:'Op schema',budget:24800,hours:86,hoursBudget:212,nextAction:'Accepteer Sprint 3 en schakel CRM-koppeling naar productie',buildItems:components.map((c,i)=>({id:c.id,title:c.title,status:i<2?'Gereed':i<4?'In uitvoering':'Gepland',progress:[100,100,72,48,0][i],owner:i%2?'Noor Bakker':'Milan Jansen'}))},
  offer:{status:'Akkoord',number:'OFF-2026-041',title:'Digitalisering, data & klantportaal – fase 1',package:'Start → Scale implementatiepakket',summary:'Van versnipperde bedrijfsinformatie naar één beheersbaar datafundament, projectportaal en dagelijkse stuurinformatie.',amount:24800,acceptedAt:'2026-08-24',validUntil:'2026-09-30',components,phases:[{name:'Fase 1 – Analyse & fundament',amount:12800,status:'Gereed'},{name:'Fase 2 – Portaal & integraties',amount:9000,status:'In uitvoering'},{name:'Fase 3 – Adoptie & overdracht',amount:3000,status:'Gepland'}],milestones:[{label:'Ontwerp & inrichting',amount:6200,status:'Betaald'},{label:'Bouw & koppelingen',amount:12400,status:'In uitvoering'},{label:'Oplevering & adoptie',amount:6200,status:'Gepland'}],subscriptions:[{name:'Beheer & monitoring',amount:'€ 495 / maand'},{name:'Power BI beheer',amount:'€ 295 / maand'}],exclusions:['Licenties van externe leveranciers','Meerwerk buiten geaccepteerde scope']},
  financial:{budget:24800,hours:86,hoursBudget:212,invoiced:6200,remaining:18600,invoices:[{number:'2026-081',date:'2026-08-28',amount:6200,status:'Betaald'},{number:'Concept',date:'2026-09-30',amount:12400,status:'Volgende termijn'}]},
  integrations:{items:integrations},
  delivery:{openTasks:tasks.filter(t=>t.status!=='Gereed').length,nextAction:'Accepteer Sprint 3 en schakel CRM-koppeling naar productie',buildItems:components.map(c=>({title:c.title,status:'Actief'})),sprints,tasks},
  deliveryPlan:{features:components.map(c=>({id:c.id,title:c.title,status:c.sprints[0]?.status||'Gepland',sprintId:c.sprints[0]?.id})),stories:sprints.flatMap(s=>s.stories.map(story=>({...story,sprintId:s.id})))},
  roadmap:{items:roadmap},
  tasks:{items:tasks},
  documents:{count:docs.length,items:docs},
  notes:{count:4,items:[{title:'Besluit: dagelijkse synchronisatie om 06:00',author:'Sanne de Vries'},{title:'Key users willen export naar Excel behouden',author:'Noor Bakker'},{title:'Productie-OAuth na acceptatietest activeren',author:'Milan Jansen'},{title:'Release alleen na production readback',author:'Sanne de Vries'}]},
  activity:[{label:'AFAS-koppeling succesvol getest',at:'Vandaag 14:42'},{label:'Sprint 3 acceptatie gestart',at:'Vandaag 13:18'},{label:'Functioneel ontwerp v1.3 toegevoegd',at:'Gisteren 16:05'},{label:'CRM API testomgeving gekoppeld',at:'10 september 11:20'},{label:'Offerte OFF-2026-041 akkoord',at:'24 augustus 11:27'}],
  team:{members:4,users:[{name:'Sanne de Vries',role:'Projecteigenaar',access:'Volledig'},{name:'Milan Jansen',role:'Solution engineer',access:'Project'},{name:'Noor Bakker',role:'Data consultant',access:'Project'},{name:'Eva Meijer',role:'Key user',access:'Lezen & accepteren'}]},
  access:{members:4,users:[{name:'Sanne de Vries',role:'Projecteigenaar'},{name:'Milan Jansen',role:'Solution engineer'},{name:'Noor Bakker',role:'Data consultant'},{name:'Eva Meijer',role:'Key user'}]}
 }
});
