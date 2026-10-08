// Complementary customer review gaps. Extends, never replaces, the existing
// Source Universe, Portal V2 and extended contextual action rules.
const at=(state,path)=>String(path).split('.').filter(Boolean).reduce((v,k)=>v==null?undefined:v[k],state);
const has=v=>v!==null&&v!==undefined&&v!==''&&!(typeof v==='string'&&!v.trim());
const n=v=>has(v)&&typeof v!=='boolean'&&Number.isFinite(Number(v))?Number(v):null;
const array=v=>Array.isArray(v)?v:[];
const pages=Object.freeze({
  profile:['profiel','gegevens-invullen','overzicht','businesscase','advies','roadmap'],
  finance:['cijfers-maatstaven','waarde-financiering','businesscase','due-diligence','advies','roadmap'],
  people:['mensen','overzicht','due-diligence','taken-werkstromen','advies','roadmap'],
  operations:['cijfers-maatstaven','uitvoeringsladder','businesscase','taken-werkstromen','advies','roadmap'],
  market:['branche-markt','onderzoek','advies','roadmap'],
  governance:['data-ai','compliance-governance','csrd-impact','due-diligence','advies','roadmap'],
  strategy:['strategie-naar-maandagochtend','canvassen','eindconclusie','taken-werkstromen','advies','roadmap'],
  goals:['bedrijfssituatie','strategie-naar-maandagochtend','businesscase','overzicht','advies','roadmap'],
  connectors:['koppelingen','datahubstatus','compliance-governance','audittrail','advies','roadmap']
});
export const DOMAIN_GAP_PAGES=Object.freeze([...new Set(Object.values(pages).flat())]);

export function appendComplementaryDomainActions(state={},cards=[],{card,item}={}){
 if(typeof card!=='function'||typeof item!=='function')throw new TypeError('ACTION_CARD_FACTORIES_REQUIRED');
 const put=(domain,id,title,priority,path,value,reason,action,targets)=>item(cards,card(id,title,priority,path,value,reason,action,targets,{
   domain,sourceEvidence:'CUSTOMER_REPORTED_NOT_INDEPENDENTLY_VERIFIED'
 }));
 const employees=n(at(state,'portal.profile.employees'));
 const hourly=n(at(state,'portal.profile.hourlyCost'));
 if(employees!==null&&employees>0&&(hourly===null||hourly<=0))put('profile','profile-cost-basis-missing','Uurkostenbasis voor verbeterpotentieel ontbreekt','P2',
  'portal.profile.hourlyCost',null,'De personeelsomvang is ingevoerd, maar zonder gevalideerde uurkosten kan geen betrouwbare capaciteitswaarde worden bepaald.',
  'Vul de eigen uurkosten en werkelijke tijdsbesteding in; verifieer voordat een businesscase wordt gemaakt.',pages.profile);

 const debt=n(at(state,'portal.valueFinance.debt')),cash=n(at(state,'portal.valueFinance.cash'));
 if(debt!==null&&cash!==null&&debt>cash&&cash>=0)put('finance','net-debt-financing-context','Financieringsruimte en netto schuld beoordelen','P2',
  'portal.valueFinance.debt',debt,'Gerapporteerde schuld is hoger dan beschikbare kasmiddelen. Zonder looptijd, convenanten en cashflow is dit geen liquiditeitsoordeel.',
  'Onderzoek aflossingskalender, interest, kasstromen en scenario’s.',pages.finance);

 const vacancies=n(at(state,'portal.people.vacancies'));
 if(vacancies!==null&&vacancies>0)put('people','vacancy-capacity-review','Vacatures raken mogelijk capaciteit','P2',
  'portal.people.vacancies',vacancies,'Er zijn '+vacancies+' openstaande vacatures. De gevolgen voor bezetting en productie zijn nog niet gekwantificeerd.',
  'Breng kritieke taken, bezetting, vacatureduur en tijdelijke maatregelen in kaart.',pages.people);

 const performance=at(state,'portal.metrics.performance')||{};
 const leadTime=n(performance.leadTime),productive=n(performance.billable);
 if(leadTime!==null&&leadTime>30)put('operations','process-lead-time-review','Lange operationele doorlooptijd beoordelen','P2',
  'portal.metrics.performance.leadTime',leadTime,'Gerapporteerde doorlooptijd '+leadTime+' dagen; 30 dagen is een interne attentiewaarde, geen sectorbenchmark.',
  'Onderzoek wachttijden, processtappen, bottlenecks en meetbaar verbeterdoel.',pages.operations);
 if(productive!==null&&productive>=0&&productive<60)put('operations','productive-time-review','Productieve uren en herstelwerk beoordelen','P2',
  'portal.metrics.performance.billable',productive,'Volgens de invoer is '+productive+'% declarabel/productief; niet automatisch een besparing.',
  'Vergelijk met de passende procesnorm en analyseer werkdruk, planning en herwerk.',pages.operations);

 if(array(at(state,'portal.research.hypotheses')).some(h=>has(h?.hypothesis)&&(!has(h?.source)||!has(h?.evidence))))
  put('market','research-source-gap','Onderzoekshypothese mist bron of bewijs','P2','portal.research.hypotheses',null,
    'Een ingevulde hypothese heeft geen complete herkomst en toetsbaar bewijs, ongeacht het opgegeven zekerheidsniveau.',
    'Leg bron, peildatum, eigenaar en verificatiemethode vast vóór gebruik in advies.',pages.market);

 const governance=n(at(state,'portal.dataAi.governance'));
 if(governance!==null&&governance>=1&&governance<=2)put('governance','ai-governance-baseline-review','AI-governancevolwassenheid vraagt opvolging','P2',
  'portal.dataAi.governance',governance,'De ingevoerde AI-governancescore is '+governance+'/5. Dit is geen juridisch oordeel over naleving.',
  'Toets verantwoordelijkheden, gebruik, contracten, menselijk toezicht en auditbewijs.',pages.governance);

 if(array(at(state,'portal.strategy.findings')).some(f=>has(f?.finding)&&!has(f?.owner)))
  put('strategy','strategic-finding-owner','Strategische bevinding zonder eigenaar','P2','portal.strategy.findings',null,
    'Er staat een strategische bevinding zonder verantwoordelijke; de uitvoering is daardoor niet aantoonbaar geborgd.',
    'Wijs een eigenaar, meetbare uitkomst en evaluatiedatum toe.',pages.strategy);
 const canvases=at(state,'portal.canvases')||{};
 if(Object.values(canvases).some(v=>v&&typeof v==='object'&&has(v.answer)&&!has(v.owner)))
  put('strategy','canvas-accountability-gap','Canvasafspraak zonder actie-eigenaar','P2','portal.canvases',null,
    'Een ingevuld canvasantwoord mist verantwoordelijk eigenaarschap.',
    'Koppel het besluit aan eigenaar, vervolgactie en afhankelijkheden.',pages.strategy);
 const conclusion=at(state,'portal.finalConclusion')||{};
 if(has(conclusion.decision)&&!has(conclusion.owner))
  put('strategy','management-decision-owner','Besluit in eindconclusie mist eigenaar','P2','portal.finalConclusion.owner',null,
    'Een vastgelegd bestuurlijk besluit heeft nog geen eigenaar.',
    'Wijs eigenaar, realistische planning en outcomecontrole toe.',pages.strategy);

 const context=at(state,'portal.business_context')||{};
 if(array(context.goals).some(g=>{
    const id=typeof g==='string'?g:g?.id||g?.goalId;
    const target=id?context.goal_targets?.[id]?.target_value:undefined;
    return Boolean(id)&&!has(target);
  }))
  put('goals','business-goal-target-gap','Bedrijfsdoel mist meetbare streefwaarde','P2','portal.business_context.goal_targets',null,
    'Een geselecteerd doel mist een expliciete streefwaarde. Zonder nulmeting en historie is een voorspelde verbetering niet betrouwbaar.',
    'Leg eigenaar, nulmeting, doeldatum en meetbare streefwaarde vast.',pages.goals);

 const connectorPaths=['portal.connections.items','portal.integrations.items','portal.koppelingen.items'];
 const connectors=connectorPaths.flatMap(path=>array(at(state,path)).map(value=>({path,value})));
 const blocked=connectors.find(({value})=>['failed','error','blocked','revoked','mislukt'].includes(String(value?.status||'').toLowerCase()));
 if(blocked)put('connectors','connector-runtime-review','Koppeling heeft fout- of autorisatiestatus','P1',
   blocked.path,null,'De klantcontext toont een geblokkeerde of mislukte koppeling. De live providerstatus is nog niet onafhankelijk teruggelezen.',
   'Controleer bevoegdheid, laatste succesvolle synchronisatie, mapping, providerbewijs en herstel.',pages.connectors);
 return cards;
}
