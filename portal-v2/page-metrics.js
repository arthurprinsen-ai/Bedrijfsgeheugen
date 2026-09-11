import { calculateLegacyEquivalent } from './legacy-parity-engine.js';
import { brancheProfiel, brancheVergelijking, onderzoekVoor, regelgevingVoor, BRONNEN } from './external-data.js';
import { REGELGEVING, komendeMijlpalen, lopendeVerplichtingen, verlopenHerzieningen } from './regelgeving.js';
import { dataBronnen, bronnenSamenvatting, SOORTEN } from './data-sources.js';
import { bouwPassport, bouwAuditRapport, STATUS_LABEL } from './passport.js';
import { bevindingen, bevindingenSamenvatting } from './bevindingen.js';
import { beoordeelPortefeuille, rangschikRisicos, auditMomentopname, STATUS_LABEL as CONTROL_LABEL } from './compliance-engine.js';

const EMPTY='—';
const num=(value,digits=0)=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(value)||0);
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const pct=value=>`${num(value,0)}%`;
const arr=value=>Array.isArray(value)?value:[];
const at=(state,path)=>String(path||'').split('.').filter(Boolean).reduce((value,key)=>value==null?undefined:value[key],state);
/** Eigen cijfers in de vorm die de branchevergelijking verwacht. */
function eigenCijfers(state){
  return {
    grossMargin:calc('gross-margin',state), ebitdaMargin:calc('ebitda-margin',state),
    wageRatio:calc('wage-ratio',state), marketingRatio:calc('marketing-ratio',state),
    itRatio:calc('it-ratio',state), dso:calc('dso',state),
    absence:at(state,'portal.people.absence'), turnover:at(state,'portal.people.turnover'),
    enps:at(state,'portal.people.enps')
  };
}

const filled=value=>value!==undefined&&value!==null&&value!==''&&!(Array.isArray(value)&&!value.length)&&!(typeof value==='object'&&!Array.isArray(value)&&!Object.keys(value).length);

function calc(id,state){
  try{return calculateLegacyEquivalent(id,state);}catch{return null;}
}

/**
 * Elke pagina beschrijft: welke state-slice hem voedt, hoe de vier kerncijfers
 * heten en worden berekend, en waar de werklijst vandaan komt. Zonder klantdata
 * geeft een pagina EMPTY terug — nooit een verzonnen getal.
 */
const PAGES=Object.freeze({
  overzicht:{slice:'portal.profile',
    metrics:s=>[
      ['Gemiddelde volwassenheid',`${num(calc('average-maturity',s),1)}/5`],
      ['Handmatig werk per jaar',euro(calc('manual-work-annual',s))],
      ['Vermijdbare capaciteit',`${num(calc('fte-lost',s),1)} fte`],
      ['Procesvolwassenheid',calc('cmmi-level',s)?`${calc('cmmi-level',s)}/5 · ${arr(calc('cmmi-ladder',s)).find(x=>x.huidig)?.naam||''}`:EMPTY]
    ],
    worklist:s=>[
      ['Stand van het bedrijf',String(calc('company-state',s)||EMPTY)],
      ['Voortgang op de roadmap',pct(calc('progress',s))],
      ...arr(calc('blocker-ranking',s)).slice(0,2).map(item=>[String(item.name||item.title||'Blokkade'),`impact ${num(item.impact)}`])
    ]},

  profiel:{slice:'portal.profile',
    metrics:s=>{const scores=arr(calc('dimension-maturity',s));return [
      ['Gemiddeld niveau',`${num(calc('profile-average',s),1)}/5`],
      ['Onderdelen beoordeeld',String(scores.length)],
      ['Handmatig werk',euro(calc('manual-work-impact',s))],
      ['Onder niveau 3',String(scores.filter(score=>Number(score)<3).length)]
    ];},
    worklist:s=>arr(calc('dimension-maturity',s)).map((score,index)=>[`Onderdeel ${index+1}`,`niveau ${num(score,1)}`]).filter(([,label])=>parseFloat(label.replace(/\D/g,''))<3).slice(0,3)},

  'data-ai':{slice:'portal.dataAi',
    metrics:s=>[
      ['Data & AI volwassenheid',`${num(calc('data-ai-maturity',s),1)}/5`],
      ['Implementatiefase',String(at(s,'portal.dataAi.phase')||EMPTY)],
      ['Veranderbereidheid',`${num(calc('change-readiness',s),1)}/5`],
      ['Groeifase',calc('greiner-phase',s)?.fase||EMPTY]
    ],
    worklist:s=>[
      ['Fase van implementatie',`${num(calc('implementation-phase',s))} van 5`],
      ['Governance readiness',`${num(calc('governance-readiness',s),1)}/5`]
    ]},

  'ai-scan':{slice:'portal.aiScan',
    metrics:s=>[
      ['Taken in beeld',String(arr(at(s,'portal.aiScan.tasks')).length)],
      ['Jaarlijkse taakkosten',euro(calc('annual-task-cost',s))],
      ['Ondersteunbaar deel',pct(calc('supportable-share',s))],
      ['Risicogewogen baat',euro(calc('risk-adjusted-benefit',s))]
    ],
    worklist:s=>arr(at(s,'portal.aiScan.tasks')).slice(0,3).map(task=>[String(task.task||'Taak'),`${num(task.hoursPerWeek)} uur/week · ${task.repetition||EMPTY}`])},

  kansenkaart:{slice:'portal.aiScan',
    metrics:s=>[
      ['Kansen',String(arr(at(s,'portal.aiScan.tasks')).length)],
      ['Kansscore',num(calc('opportunity-score',s),1)],
      ['Risicogewogen baat',euro(calc('risk-adjusted-benefit',s))],
      ['Jaarlijkse taakkosten',euro(calc('annual-task-cost',s))]
    ],
    worklist:s=>arr(at(s,'portal.aiScan.tasks')).slice(0,3).map(task=>[String(task.task||'Kans'),`data readiness ${num(task.dataReadiness)}/5`])},

  'gegevens-invullen':{slice:'portal.inputs',
    metrics:s=>[
      ['Ingevuld',pct(calc('input-completeness',s))],
      ['Velden bekend',String(Object.keys(at(s,'portal.inputs')||{}).length)],
      ['Doorgerekend',String(calc('downstream-recalculation',s)??0)],
      ['Opslag','Server-bevestigd']
    ]},

  'ingevulde-gegevens':{slice:'portal.inputs',
    metrics:s=>[
      ['Compleetheid',pct(calc('answer-completeness',s))],
      ['Records',String(Object.keys(at(s,'portal.inputs')||{}).length)],
      ['Herkomst','Eigen invoer'],
      ['Opslag','Server-bevestigd']
    ]},

  businesscase:{slice:'portal.businessCase',
    metrics:s=>[
      ['Baat op doelniveau',euro(calc('benefit-at-target-maturity',s))],
      ['Kosten van uitstel',euro(calc('delay-cost',s))],
      ['Netto resultaat',euro(calc('investment-net-result',s))],
      ['Terugverdientijd',`${num(calc('payback',s),1)} mnd`]
    ],
    worklist:s=>[
      ['Baat per maand doorlooptijd',euro(calc('benefit-per-duration',s))],
      ['Kosten-batenverloop',`${arr(calc('cost-benefit-curve',s)).length} meetpunten`]
    ]},

  'cijfers-maatstaven':{slice:'portal.metrics',
    metrics:s=>[
      ['Brutomarge',pct(calc('gross-margin',s))],
      ['EBITDA-marge',pct(calc('ebitda-margin',s))],
      ['DSO',`${num(calc('dso',s))} dgn`],
      ['Positie bij de klant',arr(calc('trusted-advisor-ladder',s)).find(x=>x.huidig)?.naam||EMPTY]
    ],
    worklist:s=>[
      ['Loonquote',pct(calc('wage-ratio',s))],
      ['IT-quote',pct(calc('it-ratio',s))],
      ['Omzet per medewerker',euro(calc('productivity',s))],
      ['Klantconcentratie',pct(calc('customer-concentration',s))],
      ['Trend in metingen',String(calc('measurement-trend',s)??EMPTY)]
    ],
    extraWorklist:s=>brancheVergelijking(eigenCijfers(s),at(s,'portal.market.industry')).filter(r=>!r.beter).slice(0,3)
      .map(r=>[`${r.maatstaf} tegen de norm`,`${num(r.eigen,1)}${r.eenheid} tegenover ${num(r.norm,1)}${r.eenheid}`])},

  'waarde-financiering':{slice:'portal.valueFinance',
    metrics:s=>[
      ['Ondernemingswaarde',euro(calc('enterprise-value',s))],
      ['Aandeelhouderswaarde',euro(calc('equity-value',s))],
      ['Altman Z',num(calc('altman-z',s),2)],
      ['Break-even omzet',euro(calc('break-even',s))]
    ],
    worklist:s=>{const d=calc('dupont-breakdown',s)||{};return [
      ['DCF-waarde',euro(calc('dcf',s))],
      ['Rentedekking',`${num(calc('interest-coverage',s),1)}x`],
      ['Schuldendekking (DSCR)',`${num(calc('dscr',s),2)}x`],
      ['Rendement op eigen vermogen (DuPont)',pct(d.roe)],
      ['EBITDA-multiple',`${num(calc('ebitda-multiple',s),1)}x`],
      ['Rendementsindex (DuPont)',num(calc('dupont',s),2)],
      ['Veiligheidsmarge',pct(calc('safety-margin',s))]
    ];}},

  mensen:{slice:'portal.people',
    metrics:s=>[
      ['Verzuim',pct(at(s,'portal.people.absence'))],
      ['Verloop',pct(at(s,'portal.people.turnover'))],
      ['eNPS',num(at(s,'portal.people.enps'))],
      ['Vacaturedruk',pct(calc('vacancy-pressure',s))]
    ],
    extraWorklist:s=>[
      ['Verzuim t.o.v. norm',num(calc('absence-gap',s),1)],
      ['Verloop t.o.v. norm',num(calc('turnover-gap',s),1)],
      ['eNPS t.o.v. norm',num(calc('enps-gap',s),1)],
      ['Volwassenheid medewerkerstevredenheid',`${num(calc('mto-maturity',s),1)}/5`]
    ],
    worklist:s=>arr(at(s,'portal.people.roles')).filter(role=>!role.backup).slice(0,3).map(role=>[String(role.name||role.role||'Rol'),'geen back-up vastgelegd'])},

  'branche-markt':{slice:'portal.market',
    metrics:s=>{const branche=at(s,'portal.market.industry');const rijen=brancheVergelijking(eigenCijfers(s),branche);const b=brancheProfiel(branche);return [
      ['Branche',String(branche||'Gemiddeld NL-bedrijf')],
      ['Vergeleken maatstaven',String(rijen.length)],
      ['Boven de norm',String(rijen.filter(r=>r.beter).length)],
      ['Groei in de sector',b?`${num(b.groei,1)}%`:EMPTY]
    ];},
    extraWorklist:s=>{const branche=at(s,'portal.market.industry');const b=brancheProfiel(branche);if(!b)return [];return [
      ['Toegevoegde waarde per vte in de sector',euro(b.tw)],
      ['Digitale intensiteit',`${num(b.dig,1)}/5`],
      ['Brancheorganisatie',String(b.inst||EMPTY)]
    ];},
    worklist:s=>[
      ['Groeicontext van de branche',String(calc('industry-growth-context',s)||EMPTY)],
      ...arr(calc('industry-benchmark-deltas',s)).filter(item=>item.delta<0).slice(0,2).map(item=>[String(item.metric||'Maatstaf'),`${num(item.delta,1)} t.o.v. benchmark`])
    ]},

  onderzoek:{slice:'portal.research',
    metrics:s=>{const items=arr(at(s,'portal.research.hypotheses'));return [
      ['Hypotheses',String(items.length)],
      ['Met bewijs',String(items.filter(item=>filled(item.evidence)).length)],
      ['Zonder bron',String(items.filter(item=>!filled(item.source)).length)],
      ['Externe bevindingen',String(onderzoekVoor().length)]
    ];},
    extraWorklist:s=>[['Positie volwassenheid tegen kosten',String(calc('maturity-vs-cost-position',s)||EMPTY)]],
    extraWorklist:()=>onderzoekVoor().slice(0,3).map(item=>[`${item.t} — ${item.cijfer}`,String(item.bron)]),
    worklist:s=>arr(at(s,'portal.research.hypotheses')).filter(item=>!filled(item.evidence)).slice(0,2).map(item=>[String(item.hypothesis||'Hypothese'),'bewijs ontbreekt'])},

  'compliance-governance':{slice:'portal.compliance',
    metrics:s=>[
      ['Beleid compleet',pct(calc('policy-completeness',s))],
      ['Governance-volwassenheid',`${num(calc('governance-maturity',s),1)}/5`],
      ['ESG readiness',`${num(calc('esg-readiness',s),1)}/5`],
      ['Regels die je raken',String(REGELGEVING.length)]
    ],
    extraWorklist:s=>{const r=regelgevingVoor(at(s,'portal.market.industry'));return [
      ...komendeMijlpalen().slice(0,3).map(m=>[`${m.datum} · ${m.regel}`,String(m.wat)]),
      ['Governance readiness',`${num(calc('governance-readiness',s),1)}/5`],
      ...r.regels.slice(0,3).map(regel=>[String(regel).split(' — ')[0],String(regel).split(' — ')[1]||`via ${r.instantie}`])
    ];},
    worklist:s=>Object.entries(at(s,'portal.compliance.policies')||{}).filter(([,status])=>status==='ontbreekt').slice(0,3).map(([index])=>[`Beleidsstuk ${Number(index)+1}`,'ontbreekt'])},

  'compliance-command-center':{slice:'portal.compliance',
    metrics:s=>{const c=arr(at(s,'portal.compliance.controls'));
      if(c.length){const p=beoordeelPortefeuille(c);return [
        ['Controls beoordeeld',`${p.toepasbaar} van ${p.totaal}`],
        ['Geverifieerd',String(p.geverifieerd)],
        ['Dekking',p.dekking==null?EMPTY:pct(p.dekking)],
        ['Raamwerken',String(Object.keys(p.raamwerken).length)]
      ];}
      return [
        ['Beleid compleet',pct(calc('policy-completeness',s))],
        ['Restrisico',pct(calc('compliance-risk',s))],
        ['ESG readiness',`${num(calc('esg-readiness',s),1)}/5`],
        ['Technologie readiness',`${num(calc('technology-readiness',s),1)}/5`]
      ];},
    worklist:s=>rangschikRisicos(arr(at(s,'portal.compliance.controls'))).slice(0,4)
      .map(r=>[`${r.raamwerk||r.framework} · ${r.requirement||r.id}`,
        `${CONTROL_LABEL[r.status]||r.status} · risico ${r.risicoScore}`]),
    extraWorklist:s=>{const c=arr(at(s,'portal.compliance.controls'));if(!c.length)return [];
      const a=auditMomentopname(c);return [['Bewijsstukken in de index',String(a.bewijsindex.length)]];},
    ongebruikt:s=>[
      ['Beleid compleet',pct(calc('policy-completeness',s))],
      ['Restrisico',pct(calc('compliance-risk',s))],
      ['ESG readiness',`${num(calc('esg-readiness',s),1)}/5`],
      ['Technologie readiness',`${num(calc('technology-readiness',s),1)}/5`]
    ]},

  'ai-capabilities':{slice:'portal.aiCapabilities',
    metrics:s=>{const k=arr(calc('dimension-costs',s));
      if(k.length)return [
        ['Kosten op huidig niveau',euro(calc('dimension-cost-total',s))],
        ['Te winnen op streefniveau',euro(calc('dimension-potential-total',s))],
        ['Duurste onderdeel',String(calc('biggest-cost-dimension',s)?.label||EMPTY)],
        ['Onderdelen met een niveau',String(k.length)]
      ];
      return [
      ['Capability readiness',`${num(calc('ai-capability-readiness',s),1)}/5`],
      ['Resterende afstand',`${num(calc('ai-capability-gap',s),1)}`],
      ['Beoordeeld',String(Object.keys(at(s,'portal.aiCapabilities')||{}).length)],
      ['Technologie readiness',`${num(calc('technology-readiness',s),1)}/5`]
    ];}},

  'strategy-dna':{slice:'portal.strategyDna',
    metrics:s=>[
      ['Laagvolwassenheid',`${num(calc('layer-maturity',s),1)}/5`],
      ['Actieve thema’s',String(calc('theme-impact',s)??0)],
      ['Capability-volwassenheid',`${num(calc('capability-maturity',s),1)}/5`],
      ['Lagen beoordeeld',String(Object.keys(at(s,'portal.strategyDna.layers')||{}).length)]
    ]},

  strategiemodellen:{slice:'portal.strategy',
    metrics:s=>[
      ['Bevindingen',String(arr(at(s,'portal.strategy.findings')).length)],
      ['Waarde in bevindingen',euro(calc('model-finding-value',s))],
      ['Na filter',String(arr(calc('priority-filter',s)).length)],
      ['Horizon',String(at(s,'portal.strategy.horizon')||EMPTY)]
    ]},

  'strategie-naar-maandagochtend':{slice:'portal.strategy',
    metrics:s=>[
      ['Bevindingen',String(arr(at(s,'portal.strategy.findings')).length)],
      ['Waarde',euro(calc('model-finding-value',s))],
      ['Binnen filter',String(arr(calc('priority-filter',s)).length)],
      ['Minimumwaarde',euro(at(s,'portal.strategy.minimumValue'))]
    ],
    worklist:s=>[
      ['Zwaartepunt in de horizon',String(calc('model-finding-horizon',s)||EMPTY)],
      ...arr(calc('priority-filter',s)).slice(0,2).map(item=>[String(item.finding||'Bevinding'),`${euro(item.value)} · ${item.horizon||EMPTY}`])
    ]},

  modellen:{slice:'portal.strategy',
    metrics:s=>[
      ['Bevindingen',String(arr(at(s,'portal.strategy.findings')).length)],
      ['Canvascompleetheid',pct(calc('canvas-completeness',s))],
      ['Consensus',pct(calc('cross-source-consensus',s))],
      ['Waarde',euro(calc('model-finding-value',s))]
    ]},

  canvassen:{slice:'portal.canvases',
    metrics:s=>[
      ['Canvascompleetheid',pct(calc('canvas-completeness',s))],
      ['Consensus',pct(calc('canvas-consensus',s))],
      ['Ingevuld',String(Object.values(at(s,'portal.canvases')||{}).filter(item=>filled(item?.answer)).length)],
      ['Met eigenaar',String(Object.values(at(s,'portal.canvases')||{}).filter(item=>filled(item?.owner)).length)]
    ]},

  eindconclusie:{slice:'portal.finalConclusion',
    metrics:s=>{const synthesis=calc('final-synthesis',s)||{};return [
      ['Consensus',pct(synthesis.consensus)],
      ['Waarde',euro(synthesis.value)],
      ['Capaciteit',`${num(synthesis.capacity,1)} fte`],
      ['Restrisico',pct(synthesis.risk)]
    ];},
    worklist:s=>{const afgeleid=bevindingen(s);
      if(afgeleid.length)return afgeleid.slice(0,5).map(b=>[
        `${b.waarde?'€ '+b.waarde.toLocaleString('nl-NL')+' · ':''}${b.titel}`,
        `${b.bewijs} — ${b.bron}`]);
      return [
      ['Gewicht over de modellen heen',num(calc('cross-model-weight',s),2)],
      ...arr(calc('recommendation-priority',s)).slice(0,2).map(item=>[String(item.advice||'Advies'),`prioriteit ${num(item.priority)}`])
    ];}},

  'due-diligence':{slice:'portal.dueDiligence',
    metrics:s=>[
      ['Dossier-readiness',pct(calc('dd-readiness',s))],
      ['Materialiteit',num(calc('materiality',s),1)],
      ['Red flags',String(calc('red-flags',s)??0)],
      ['Overdraagbaarheid',pct(calc('transferability',s))]
    ],
    worklist:s=>arr(at(s,'portal.dueDiligence.findings')).filter(item=>item.redFlag===true).slice(0,3).map(item=>[String(item.area||'Onderdeel'),String(item.finding||'red flag')])},

  exit:{slice:'portal.dueDiligence',
    metrics:s=>[
      ['Exit-readiness',pct(calc('transferability',s))],
      ['Red flags',String(calc('red-flags',s)??0)],
      ['Aandeelhouderswaarde',euro(calc('equity-value',s))],
      ['Dossier-readiness',pct(calc('dd-readiness',s))]
    ]},

  'actueel-houden':{slice:'portal.freshness',
    metrics:s=>[
      ['Actualiteit',pct(calc('freshness',s))],
      ['Verlopen items',String(calc('expired-items',s)??0)],
      ['Met eigenaar',pct(calc('ownership-completeness',s))],
      ['Laatste review',String(at(s,'portal.freshness.reviewDate')||EMPTY)]
    ]},

  wijzigingen:{slice:'portal.changes',
    metrics:s=>{const items=arr(at(s,'portal.changes.items'));return [
      ['Wijzigingen',String(items.length)],
      ['Gemiddelde impact',`${num(calc('change-impact',s),1)}/5`],
      ['Opvolging geborgd',pct(calc('follow-up-status',s))],
      ['Open',String(items.filter(item=>item.status==='Open').length)]
    ];},
    worklist:s=>[
      ['Volgorde van doorvoeren',String(arr(calc('change-sequencing',s)).length||EMPTY)],
      ...arr(at(s,'portal.changes.items')).filter(item=>item.status!=='Geborgd').slice(0,2).map(item=>[String(item.change||'Wijziging'),`${item.area||EMPTY} · ${item.status||'Open'}`])
    ]},

  advies:{slice:'portal.advice',
    /* Deze pagina las alleen een lijst die iemand met de hand had ingetypt en
       bleef daarom leeg bij een volledig ingevuld bedrijf. Hij leidt nu af uit
       wat er al is doorgerekend; zie bevindingen.js. Een eigen ingetypte lijst
       blijft werken en gaat voor. */
    metrics:s=>{const afgeleid=bevindingen(s);
      if(afgeleid.length){const v=bevindingenSamenvatting(s);return [
        ['Bevindingen',String(v.totaal)],
        ['Met een bedrag',String(v.metWaarde)],
        ['Waarde per jaar',euro(v.waardePerJaar)],
        ['Eerst aanpakken',String(v.eerste?.titel||EMPTY).slice(0,40)],
        ['Van je onderdelen geraakt',pct(v.dekking)]
      ];}
      const items=arr(at(s,'portal.advice.items'));return [
      ['Adviezen',String(items.length)],
      ['Hoge prioriteit',String(items.filter(item=>Number(item.priority)>=4).length)],
      ['Totale waarde',euro(items.reduce((sum,item)=>sum+(Number(item.value)||0),0))],
      ['Met eigenaar',String(items.filter(item=>filled(item.owner)).length)]
    ];},
    worklist:s=>{const afgeleid=bevindingen(s);
      if(afgeleid.length)return afgeleid.slice(0,5).map(b=>[
        `${b.waarde?'€ '+b.waarde.toLocaleString('nl-NL')+' · ':''}${b.titel}`,
        `${b.bewijs} — ${b.bron}`]);
      return arr(calc('advice-priority',s)).slice(0,3).map(item=>[String(item.advice||'Advies'),`${euro(item.value)} · ${num(item.duration)} wk`]);}},

  offerte:{slice:'portal.offer',
    metrics:s=>[
      ['Pakket',String(at(s,'portal.offer.package')||EMPTY)],
      ['Doorlooptijd',`${num((Number(at(s,'portal.offer.sprints'))||0)*2)} weken`],
      ['Totaal',euro(calc('offer-total',s))],
      ['Akkoord',at(s,'portal.offer.approval.agreed')===true?`door ${at(s,'portal.offer.approval.name')||'klant'}`:'nog niet gegeven']
    ],
    worklist:s=>[
      ['Prijs per week',euro(calc('weekly-price',s))],
      ['Eindprijs',euro(calc('end-price',s))],
      ...arr(at(s,'portal.offer.additionalWork')).slice(0,1).map(item=>[String(item.description||'Meerwerk'),`${euro(item.price)} · ${item.status||'Open'}`])
    ]},

  roadmap:{slice:'portal.roadmap',
    metrics:s=>{const items=arr(at(s,'portal.roadmap.items'));return [
      ['Items',String(items.length)],
      ['Voortgang',pct(calc('completion-progress',s))],
      ['Totale duur',`${num(calc('duration',s))} mnd`],
      ['Waarde',euro(calc('roadmap-value',s))]
    ];},
    worklist:s=>[
      ['Positie in de tijdlijn',String(calc('timeline-position',s)||EMPTY)],
      ...arr(at(s,'portal.roadmap.items')).filter(item=>item.done!==true).slice(0,2).map(item=>[String(item.title||'Item'),`${num(item.progress)}% · ${item.owner||'geen eigenaar'}`])
    ]},

  uitvoeringsladder:{slice:'portal.roadmap',
    metrics:s=>{const items=arr(at(s,'portal.roadmap.items'));return [
      ['Items',String(items.length)],
      ['Geborgd',String(items.filter(item=>item.done===true).length)],
      ['Voortgang',pct(calc('completion-progress',s))],
      ['Zonder eigenaar',String(items.filter(item=>!filled(item.owner)).length)]
    ];}},

  'taken-werkstromen':{slice:'portal.tasks',
    metrics:s=>{const items=arr(at(s,'portal.tasks.items'));return [
      ['Open taken',String(items.filter(item=>item.status!=='Klaar').length)],
      ['Totaal',String(items.length)],
      ['Geblokkeerd',String(items.filter(item=>item.status==='Geblokkeerd').length)],
      ['Zonder eigenaar',String(items.filter(item=>!filled(item.owner)).length)]
    ];},
    worklist:s=>arr(at(s,'portal.tasks.items')).filter(item=>item.status!=='Klaar').slice(0,3).map(item=>[String(item.title||'Taak'),`${item.owner||'geen eigenaar'} · ${item.due||'geen datum'}`])},

  'data-ai-passport':{slice:'portal.dataAiPassport',
    metrics:s=>{const p=bouwPassport(s);const v=p.samenvatting;return [
      ['Bewijsdekking',pct(v.bewijsdekkingPct)],
      ['Geverifieerd',`${v.verified} van ${v.totaal}`],
      ['Nog te bewijzen',String(v.onbekend)],
      ['Actie nodig',String(v.actie)]
    ];},
    worklist:s=>bouwPassport(s).controls
      .filter(c=>c.status==='action_required'||c.status==='unknown').slice(0,4)
      .map(c=>[c.label,`${STATUS_LABEL[c.status]} · ${c.punt||c.uitleg}`.slice(0,90)]),
    extraWorklist:s=>{const p=bouwPassport(s);return [
      ['Bewijsstukken',String(p.controls.reduce((n,c)=>n+c.bewijsAantal,0))],
      ['Waarvan geverifieerd',String(p.controls.reduce((n,c)=>n+c.bewijsGeverifieerd,0))]
    ];}},

  'eu-ai-act-audit':{slice:'portal.dataAiPassport',
    metrics:s=>{const r=bouwAuditRapport(s);return [
      ['AI-systemen in scope',String(r.scope.systemen)],
      ['Open bevindingen',String(r.bevindingen.length)],
      ['Transparantiecontrols',String(r.transparantie.length)],
      ['Bewijsstukken',String(r.bewijsindex.length)]
    ];},
    worklist:s=>bouwAuditRapport(s).bevindingen.slice(0,3)
      .map(b=>[`${b.article||'Bevinding'} · ${b.title||''}`.trim(),`eigenaar ${b.owner||'niet toegewezen'}`]),
    extraWorklist:s=>bouwAuditRapport(s).baseline.mijlpalen
      .filter(m=>m.datum>=new Date().toISOString().slice(0,10)).slice(0,3)
      .map(m=>[`${m.datum} · ${m.regel}`,String(m.wat)])},

  'csrd-impact':{slice:'portal.compliance',
    metrics:s=>[
      ['ESG readiness',`${num(calc('esg-readiness',s),1)}/5`],
      ['Beleid compleet',pct(calc('policy-completeness',s))],
      ['Restrisico',pct(calc('compliance-risk',s))],
      ['Domeinen beoordeeld',String(Object.keys(at(s,'portal.compliance.esg')||{}).length)]
    ]}
});

/** Pagina's die alleen iets mogen tonen als er runtime-evidence is. */
const RUNTIME_PAGES=Object.freeze({
  bronnenstatus:'portal.runtime.sources', datahubstatus:'portal.runtime.datahub',
  'brain-verwerking':'portal.runtime.brain', agentstatus:'portal.runtime.agents',
  'actieve-acties':'portal.runtime.actions', 'recovery-obligations':'portal.runtime.recovery',
  'outcomes-evidence':'portal.runtime.outcomes', 'learning-writeback':'portal.runtime.learning',
  'self-heal':'portal.runtime.selfHeal', audittrail:'portal.runtime.audit',
  koppelingen:'portal.connectors', gebruikers:'portal.admin.users',
  documenten:'portal.admin.documents', instellingen:'portal.admin.settings', audit:'portal.admin.audit'
});

/**
 * Kerncijfers per Brein- en Powerhouse-pagina, afgeleid uit de projectie van de
 * operating loop (zie runtime-evidence.js). Elke pagina krijgt cijfers die bij
 * zijn eigen onderwerp horen, niet vier keer hetzelfde. Zonder evidence: leeg.
 */
const RUNTIME_METRICS=Object.freeze({
  // Deze pagina toonde alleen de runtime-integraties. Het portaal wordt door
  // vier soorten data gevoed; als er één ontbreekt is de lus onderbroken, en
  // dat hoort hier zichtbaar te zijn.
  bronnenstatus:(items,s,state)=>{const sam=bronnenSamenvatting(state||{});return [
    ['Databronnen',String(sam.totaal)],
    ['Voeden het portaal',String(sam.gezond)],
    ['Onderbroken',String(sam.aandacht)],
    ['Laatste signaal',String(s.updatedAt||EMPTY)]
  ];},
  datahubstatus:(items,s)=>[
    ['Entiteiten',String(items.length)],
    ['Verbindingen',String(s.edges??0)],
    ['Dichtheid',items.length?`${num((s.edges||0)/items.length,1)}×`:EMPTY],
    ['Bijgewerkt',String(s.updatedAt||EMPTY)]
  ],
  'brain-verwerking':(items,s)=>[
    ['Lussen',String(s.loops??0)],
    ['Rond',String(s.compleet??0)],
    ['Onderweg',String(s.incompleet??0)],
    ['Stappen op orde',`${items.filter(x=>x.healthy).length}/${items.length}`]
  ],
  agentstatus:(items,s)=>[
    ['Gebeurtenissen',String(items.length)],
    ['Geblokkeerd',String(items.filter(x=>!x.healthy).length)],
    ['Doorloop',items.length?pct(items.filter(x=>x.healthy).length/items.length*100):EMPTY],
    ['Laatste',String(s.updatedAt||EMPTY)]
  ],
  'actieve-acties':items=>[
    ['Open acties',String(items.length)],
    ['Hoge prioriteit',String(items.filter(x=>/hoog|high|1/i.test(String(x.status))).length)],
    ['Waarde in acties',euro(items.reduce((sum,x)=>sum+(Number(x.waarde)||0),0))],
    ['Zonder waarde',String(items.filter(x=>!x.waarde).length)]
  ],
  'recovery-obligations':(items,s)=>[
    ['Openstaande verplichtingen',String(items.length)],
    ['Open lussen',String(s.openLoops??0)],
    ['Met datum',String(arr(items).filter(x=>x.laatst).length)],
    ['Bijgewerkt',String(s.updatedAt||EMPTY)]
  ],
  'outcomes-evidence':(items,s)=>[
    ['Uitkomsten',String(items.length)],
    ['Geverifieerd',String(items.filter(x=>x.healthy).length)],
    ['Geverifieerde waarde',euro(items.filter(x=>x.healthy).reduce((sum,x)=>sum+(Number(x.waarde)||0),0))],
    ['Nog te verifiëren',String(items.filter(x=>!x.healthy).length)]
  ],
  'learning-writeback':items=>[
    ['Leringen',String(items.length)],
    ['Bewezen',String(items.filter(x=>x.healthy).length)],
    ['In onderzoek',String(items.filter(x=>!x.healthy).length)],
    ['Bewezen deel',items.length?pct(items.filter(x=>x.healthy).length/items.length*100):EMPTY]
  ],
  'self-heal':(items,s)=>[
    ['Lussen die vastlopen',String(items.length)],
    ['Rond',String(s.compleet??0)],
    ['Totaal',String(s.totaal??0)],
    ['Grootste gat',items.length?`${Math.max(...items.map(x=>Number(x.ontbreekt)||0))} stappen`:EMPTY]
  ],
  audittrail:(items,s)=>[
    ['Vastgelegde records',String(items.length)],
    ['Soorten',String(new Set(items.map(x=>x.naam)).size)],
    ['Laatste record',String(s.updatedAt||EMPTY)],
    ['Onafgebroken',items.length?'ja':EMPTY]
  ]
});

function runtimeMetrics(pageId,state){
  const s=at(state,RUNTIME_PAGES[pageId])||{};
  const items=arr(s.items);
  // bronnenstatus toont ook zonder runtime-evidence iets: de externe bronnen
  // en de rekenregels staan er hoe dan ook, en juist het ontbreken van de
  // andere twee is de informatie die die pagina moet geven.
  if(pageId!=='bronnenstatus'&&!items.length&&!Number(s.loops)&&!Number(s.totaal))return null;
  const bouwer=RUNTIME_METRICS[pageId];
  if(bouwer){try{return bouwer(items,s,state);}catch{return null;}}
  return [
    ['Records',String(items.length)],
    ['Gezond',String(items.filter(item=>item.status==='ok'||item.healthy===true).length)],
    ['Aandacht',String(items.filter(item=>item.status&&item.status!=='ok').length)],
    ['Bijgewerkt',String(s.updatedAt||EMPTY)]
  ];
}

/** Werklijst voor de runtime-pagina's: alleen wat aandacht vraagt. */
function bronnenWorklist(state){
  return dataBronnen(state||{}).map(item=>[
    `${item.gezond?'':'Onderbroken · '}${item.naam}`,
    `${item.aantal} ${item.eenheid} — ${item.detail}`
  ]);
}

function runtimeWorklist(pageId,state){
  if(pageId==='bronnenstatus')return bronnenWorklist(state);
  const s=at(state,RUNTIME_PAGES[pageId])||{};
  return arr(s.items).filter(item=>item.healthy===false).slice(0,3)
    .map(item=>[String(item.naam||'Item'),String(item.status||'aandacht')]);
}

export function hasPageData(pageId,state={}){
  if(pageId==='bronnenstatus')return true;
  // advies leidt af uit doorgerekende gegevens; dan is de eigen slice leeg maar
  // is er wel degelijk iets te tonen.
  if(pageId==='advies'&&bevindingen(state).length)return true;
  // ai-capabilities toont de kosten per bedrijfsonderdeel zodra er
  // volwassenheidsniveaus zijn ingevuld, ook zonder capability-scores.
  if(pageId==='ai-capabilities'&&arr(calc('dimension-costs',state)).length)return true;
  if(RUNTIME_PAGES[pageId]){const s=at(state,RUNTIME_PAGES[pageId])||{};return arr(s.items).length>0||Number(s.loops)>0||Number(s.totaal)>0;}
  const slice=PAGES[pageId]?.slice;
  return slice?filled(at(state,slice)):false;
}

/**
 * Kerncijfers voor een pagina. Zonder klantdata: vier keer EMPTY, geen aanname.
 */
export function pageMetrics(pageId,state={}){
  if(RUNTIME_PAGES[pageId]){
    return runtimeMetrics(pageId,state)||[['Records',EMPTY],['Gezond',EMPTY],['Aandacht',EMPTY],['Bijgewerkt',EMPTY]];
  }
  const definition=PAGES[pageId];
  if(!definition)return [];
  if(!hasPageData(pageId,state))return definition.metrics({}).map(([label])=>[label,EMPTY]);
  try{return definition.metrics(state);}catch{return definition.metrics({}).map(([label])=>[label,EMPTY]);}
}

/**
 * Werklijst: alleen echte openstaande punten uit de eigen data.
 */
export function pageWorklist(pageId,state={}){
  if(RUNTIME_PAGES[pageId])return hasPageData(pageId,state)?runtimeWorklist(pageId,state):[];
  const definition=PAGES[pageId];
  if(!definition||!hasPageData(pageId,state))return [];
  const rijen=[];
  for(const bron of [definition.worklist,definition.extraWorklist]){
    if(typeof bron!=='function')continue;
    try{rijen.push(...bron(state));}catch{/* een kapotte afleiding mag de pagina niet slopen */}
  }
  return rijen.filter(row=>Array.isArray(row)&&row.length===2).slice(0,6);
}

export function emptyStateCopy(pageId){
  if(RUNTIME_PAGES[pageId])return 'Nog geen runtime-evidence voor dit onderdeel. Er wordt geen status getoond die niet gemeten is.';
  return 'Nog geen gegevens ingevuld voor dit onderdeel. Zodra je de velden invult, rekent het portaal deze cijfers door.';
}

export function listMetricPages(){return [...Object.keys(PAGES),...Object.keys(RUNTIME_PAGES)];}
export const METRIC_EMPTY=EMPTY;
