export const LIFECYCLE_CONTEXTS=Object.freeze({
  grow:Object.freeze({
    id:'grow',label:'Groeien & professionaliseren',intent:'scale_value',
    questions:Object.freeze(['Waar zit aantoonbare waarde?','Welke capability blokkeert groei?','Wat moet eerst worden gebouwd of gekoppeld?']),
    models:Object.freeze(['DuPont','BCG','Ansoff','Capability maturity','Businesscase','Impact Engine','Scenario Simulator']),
    pages:Object.freeze(['businesscase','strategie-naar-maandagochtend','strategy-dna','os:impact-engine','os:scenario-simulator','os:next-best-actions','roadmap','koppelingen','outcomes-evidence'])
  }),
  loss:Object.freeze({
    id:'loss',label:'Verlies & herstel',intent:'restore_margin_cash',
    questions:Object.freeze(['Waar verdwijnen marge en cash?','Welke klanten, producten of processen vernietigen waarde?','Welke acties verbeteren cash binnen 13 weken?']),
    models:Object.freeze(['Break-even','Contribution margin','Cash conversion','Cost-to-serve','13-weeks cashflow','Impact Engine','Scenario Simulator']),
    pages:Object.freeze(['waarde-financiering','businesscase','cijfers-maatstaven','os:impact-engine','os:scenario-simulator','actieve-acties','roadmap','outcomes-evidence'])
  }),
  crisis:Object.freeze({
    id:'crisis',label:'Acute continuïteit',intent:'protect_continuity',
    questions:Object.freeze(['Hoe lang is de cash runway?','Welke verplichtingen en afhankelijkheden zijn kritiek?','Wat moet vandaag, deze week en deze maand gebeuren?']),
    models:Object.freeze(['13-weeks cashflow','Cash runway','Scenario planning','Dependency map','Decision log','Impact Engine']),
    pages:Object.freeze(['waarde-financiering','os:scenario-simulator','os:next-best-actions','recovery-obligations','actieve-acties','audittrail','outcomes-evidence'])
  }),
  buy:Object.freeze({
    id:'buy',label:'Bedrijf kopen',intent:'buy_side_ma',
    questions:Object.freeze(['Klopt de genormaliseerde performance?','Welke operationele en data-risico’s zijn materieel?','Is de integratiebusinesscase uitvoerbaar?']),
    models:Object.freeze(['Normalized EBITDA','QoE-signalen','Working capital','Customer concentration','Key-person risk','Synergy map','100-dagenplan']),
    pages:Object.freeze(['due-diligence','waarde-financiering','documenten','audit','model-bcg','os:scenario-simulator','roadmap','outcomes-evidence'])
  }),
  sell:Object.freeze({
    id:'sell',label:'Bedrijf verkopen',intent:'sell_side_exit',
    questions:Object.freeze(['Wat drukt de ondernemingswaarde?','Welke afhankelijkheden maken overdracht kwetsbaar?','Welk bewijs moet vóór due diligence op orde zijn?']),
    models:Object.freeze(['Exit readiness','Normalized KPI set','Key-person risk','Process evidence','Value leakage','Data room readiness']),
    pages:Object.freeze(['exit','due-diligence','waarde-financiering','documenten','audit','roadmap','outcomes-evidence'])
  }),
  portfolio:Object.freeze({
    id:'portfolio',label:'Investeerder / portfolio',intent:'portfolio_value_creation',
    questions:Object.freeze(['Welke participatie vraagt managementaandacht?','Waar zit de grootste value-creation kans?','Welke risico’s of afwijkingen zijn portfolio-breed zichtbaar?']),
    models:Object.freeze(['Portfolio benchmark','Value creation','Risk heatmap','BCG','Capital allocation','Execution tracking']),
    pages:Object.freeze(['model-bcg','waarde-financiering','due-diligence','os:impact-engine','os:scenario-simulator','os:next-best-actions','outcomes-evidence','audittrail'])
  })
});

export const SCALE_CORE_SURFACES=Object.freeze([
  'Executive cockpit','Strategy DNA','Strategiemodellen','Businesscase','€ Impact Engine',
  'Scenario Simulator','Capability Graph','Externe intelligence','AI-copilot','Acties & approvals',
  'Roadmap & uitvoering','Outcomes & evidence','Audittrail','Due diligence','Exit','Portfolio-context'
]);

const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const lower=value=>String(value??'').trim().toLowerCase();

export function detectLifecycleContext(state={}){
  const explicit=lower(state?.portal?.lifecycle?.stage||state?.portal?.context?.stage||state?.company?.lifecycle_stage);
  if(LIFECYCLE_CONTEXTS[explicit])return Object.freeze({stage:explicit,source:'explicit',confidence:1,reasons:Object.freeze(['expliciet gekozen bedrijfsstadium'])});

  const transaction=lower(state?.portal?.transaction?.type||state?.transaction?.type||state?.ma?.type);
  if(['buy','buy-side','acquisition','acquire'].includes(transaction))return Object.freeze({stage:'buy',source:'transaction',confidence:.95,reasons:Object.freeze(['buy-side transactiecontext'])});
  if(['sell','sell-side','exit','divest'].includes(transaction))return Object.freeze({stage:'sell',source:'transaction',confidence:.95,reasons:Object.freeze(['sell-side transactiecontext'])});

  const companies=arr(state?.portal?.portfolio?.companies||state?.portfolio?.companies);
  if(companies.length>1)return Object.freeze({stage:'portfolio',source:'portfolio',confidence:.9,reasons:Object.freeze(['meerdere participaties in context'])});

  const finance=state?.portal?.finance||state?.finance||state?.portal?.profile?.finance||{};
  const ebitda=num(finance.ebitda??finance.operating_profit);
  const netIncome=num(finance.net_income??finance.profit);
  const runway=num(finance.cash_runway_weeks??finance.runway_weeks);
  const cashStress=runway!=null&&runway<=13;
  const loss=(ebitda!=null&&ebitda<0)||(netIncome!=null&&netIncome<0);
  if(cashStress)return Object.freeze({stage:'crisis',source:'finance',confidence:.85,reasons:Object.freeze(['cash runway ≤ 13 weken'])});
  if(loss)return Object.freeze({stage:'loss',source:'finance',confidence:.8,reasons:Object.freeze(['negatief resultaat in klantdata'])});

  return Object.freeze({stage:'grow',source:'default',confidence:0,reasons:Object.freeze(['geen expliciete lifecycle-context; groei is alleen navigatiestandaard'])});
}

export function buildLifecycleProjection(state={}){
  const detected=detectLifecycleContext(state);
  const context=LIFECYCLE_CONTEXTS[detected.stage];
  const runtime=state?.portal?.runtime||{};
  const sources=arr(runtime?.sources?.items||state?.portal?.sources);
  const actions=arr(runtime?.actions?.items||state?.portal?.actions?.items||state?.portal?.actions);
  const outcomes=arr(runtime?.outcomes?.items||state?.portal?.outcomes?.items||state?.portal?.outcomes);
  const risks=arr(state?.portal?.risks||state?.risks);
  const subscription=state?.portal?.admin?.billing||state?.admin?.billing||{};
  return Object.freeze({
    ...detected,
    context,
    connected:Object.freeze({
      sources:sources.length,
      actions:actions.length,
      outcomes:outcomes.length,
      risks:risks.length
    }),
    plan:Object.freeze({
      code:lower(subscription.plan||subscription.plan_code)||null,
      status:subscription.status||null
    })
  });
}
