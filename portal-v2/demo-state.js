export const DEMO_USER=Object.freeze({
  email:'demo@bedrijfsgeheugen.nl',
  name:'Sanne de Vries',
  user_metadata:Object.freeze({full_name:'Sanne de Vries'}),
  app_metadata:Object.freeze({role:'Projecteigenaar'})
});

export const DEMO_PORTAL_STATE=Object.freeze({
  company:Object.freeze({
    name:'Noordwind Services B.V. — Demo',
    naam:'Noordwind Services B.V. — Demo',
    portalBrand:Object.freeze({name:'Noordwind Services B.V. — Demo'}),
    sector:'Zakelijke dienstverlening',
    employees:64
  }),
  user:Object.freeze({role:'Projecteigenaar'}),
  portal:Object.freeze({
    project:Object.freeze({
      name:'Klantportaal & datakoppelingen 2026',
      phase:'Bouwen',
      status:'Op schema',
      budget:24800,
      hours:86,
      hoursBudget:212,
      nextAction:'Test AFAS → Power BI-koppeling met key users',
      buildItems:Object.freeze([
        Object.freeze({id:'build-1',title:'Klantportaal V2',status:'In uitvoering',progress:78,owner:'Milan Jansen'}),
        Object.freeze({id:'build-2',title:'AFAS → Power BI datamodel',status:'Testen',progress:84,owner:'Noor Bakker'}),
        Object.freeze({id:'build-3',title:'CRM synchronisatie',status:'In uitvoering',progress:55,owner:'Milan Jansen'}),
        Object.freeze({id:'build-4',title:'Webhook monitoring',status:'Gereed',progress:100,owner:'Noor Bakker'})
      ])
    }),
    offer:Object.freeze({
      status:'Akkoord',
      number:'OFF-2026-041',
      title:'Digitalisering & AI – fase 1',
      amount:24800,
      acceptedAt:'2026-08-24',
      validUntil:'2026-09-30',
      milestones:Object.freeze([
        Object.freeze({label:'Ontwerp & inrichting',amount:6200,status:'Betaald'}),
        Object.freeze({label:'Bouw & koppelingen',amount:12400,status:'In uitvoering'}),
        Object.freeze({label:'Oplevering & adoptie',amount:6200,status:'Gepland'})
      ])
    }),
    financial:Object.freeze({
      budget:24800,
      hours:86,
      hoursBudget:212,
      invoiced:6200,
      remaining:18600,
      invoices:Object.freeze([
        Object.freeze({number:'2026-081',date:'2026-08-28',amount:6200,status:'Betaald'}),
        Object.freeze({number:'Concept',date:'2026-09-30',amount:12400,status:'Volgende termijn'})
      ])
    }),
    integrations:Object.freeze({
      items:Object.freeze([
        Object.freeze({id:'afas',name:'AFAS',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:42'}),
        Object.freeze({id:'m365',name:'Microsoft 365',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:31'}),
        Object.freeze({id:'powerbi',name:'Power BI',status:'Verbonden',health:'Gezond',lastSync:'Vandaag 14:39'}),
        Object.freeze({id:'crm',name:'CRM API',status:'Testomgeving',health:'Aandacht',lastSync:'Vandaag 13:58'})
      ])
    }),
    delivery:Object.freeze({
      openTasks:7,
      nextAction:'Test AFAS → Power BI-koppeling met key users',
      buildItems:Object.freeze([
        Object.freeze({title:'Klantportaal V2',status:'In uitvoering'}),
        Object.freeze({title:'AFAS → Power BI',status:'Testen'}),
        Object.freeze({title:'CRM synchronisatie',status:'In uitvoering'}),
        Object.freeze({title:'Webhook monitoring',status:'Gereed'})
      ]),
      sprints:Object.freeze([
        Object.freeze({id:'s1',name:'Sprint 1 – Fundament',status:'Gereed',progress:100,stories:Object.freeze([
          Object.freeze({id:'us-01',title:'Als projectteam willen we één gedeeld klantbeeld',status:'Gereed',points:5}),
          Object.freeze({id:'us-02',title:'Als manager wil ik actuele project-KPI’s zien',status:'Gereed',points:8})
        ])}),
        Object.freeze({id:'s2',name:'Sprint 2 – Koppelingen',status:'Actief',progress:68,stories:Object.freeze([
          Object.freeze({id:'us-03',title:'Als controller wil ik AFAS-data dagelijks in Power BI',status:'Testen',points:8}),
          Object.freeze({id:'us-04',title:'Als accountmanager wil ik CRM-mutaties automatisch synchroniseren',status:'In uitvoering',points:5}),
          Object.freeze({id:'us-05',title:'Als beheerder wil ik fouten direct terugzien',status:'Te doen',points:3})
        ])}),
        Object.freeze({id:'s3',name:'Sprint 3 – Adoptie & overdracht',status:'Gepland',progress:0,stories:Object.freeze([
          Object.freeze({id:'us-06',title:'Als key user wil ik een korte werkinstructie',status:'Te doen',points:3}),
          Object.freeze({id:'us-07',title:'Als eigenaar wil ik beheer en monitoring geborgd hebben',status:'Te doen',points:5})
        ])})
      ]),
      tasks:Object.freeze([
        Object.freeze({title:'AFAS-testdata valideren',status:'Vandaag',owner:'Noor Bakker'}),
        Object.freeze({title:'CRM OAuth-productieaccount koppelen',status:'Deze week',owner:'Milan Jansen'}),
        Object.freeze({title:'Acceptatiesessie key users',status:'Gepland',owner:'Sanne de Vries'}),
        Object.freeze({title:'Beheerhandleiding opleveren',status:'Backlog',owner:'Noor Bakker'})
      ])
    }),
    documents:Object.freeze({
      count:5,
      items:Object.freeze([
        Object.freeze({name:'Functioneel ontwerp v1.3',type:'PDF',status:'Actueel'}),
        Object.freeze({name:'AFAS–Power BI mapping',type:'XLSX',status:'Actueel'}),
        Object.freeze({name:'Acceptatie- en testplan',type:'DOCX',status:'Concept'}),
        Object.freeze({name:'Architectuurplaat',type:'PDF',status:'Actueel'}),
        Object.freeze({name:'Beheerafspraken',type:'DOCX',status:'In bewerking'})
      ])
    }),
    notes:Object.freeze({
      count:3,
      items:Object.freeze([
        Object.freeze({title:'Besluit: dagelijkse synchronisatie om 06:00',author:'Sanne de Vries'}),
        Object.freeze({title:'Key users willen export naar Excel behouden',author:'Noor Bakker'}),
        Object.freeze({title:'Productie-OAuth na acceptatietest activeren',author:'Milan Jansen'})
      ])
    }),
    activity:Object.freeze([
      Object.freeze({label:'AFAS-koppeling succesvol getest',at:'Vandaag 14:42'}),
      Object.freeze({label:'User story “CRM synchronisatie” naar In uitvoering',at:'Vandaag 13:18'}),
      Object.freeze({label:'Functioneel ontwerp v1.3 toegevoegd',at:'Gisteren 16:05'}),
      Object.freeze({label:'Sprint 2 gestart',at:'8 september 09:00'}),
      Object.freeze({label:'Offerte OFF-2026-041 akkoord',at:'24 augustus 11:27'})
    ]),
    team:Object.freeze({
      members:4,
      users:Object.freeze([
        Object.freeze({name:'Sanne de Vries',role:'Projecteigenaar',access:'Volledig'}),
        Object.freeze({name:'Milan Jansen',role:'Solution engineer',access:'Project'}),
        Object.freeze({name:'Noor Bakker',role:'Data consultant',access:'Project'}),
        Object.freeze({name:'Eva Meijer',role:'Key user',access:'Lezen & accepteren'})
      ])
    }),
    access:Object.freeze({
      members:4,
      users:Object.freeze([
        Object.freeze({name:'Sanne de Vries',role:'Projecteigenaar'}),
        Object.freeze({name:'Milan Jansen',role:'Solution engineer'}),
        Object.freeze({name:'Noor Bakker',role:'Data consultant'}),
        Object.freeze({name:'Eva Meijer',role:'Key user'})
      ])
    })
  })
});
