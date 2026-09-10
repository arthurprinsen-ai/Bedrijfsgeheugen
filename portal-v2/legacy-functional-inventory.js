const frozen = value => Object.freeze(value);
const ids = (...values) => frozen(values.map(legacyFieldId => frozen({ legacyFieldId })));
const capability = (v2Page, fields=[], models=[], calculations=[], actions=[], dependencies=[], extra={}) => frozen({
  v2Page,
  fields: frozen(fields),
  models: frozen(models),
  calculations: frozen(calculations),
  actions: frozen(actions),
  dependencies: frozen(dependencies),
  ...extra,
});

const GLOBAL_CAPABILITIES = frozen([
  'authenticated-customer-context','logout','export','import','permission-gated-print',
  'feedback','customer-branding','mobile-navigation'
]);

export const LEGACY_FUNCTIONAL_INVENTORY = frozen({
  overzicht: capability('overzicht', [],
    ['CMMI maturity','adoption curve','time leakage','blockers','progress'], ['average-maturity','manual-work-annual','fte-lost','company-state','blocker-ranking','progress','advice-priority', 'cmmi-level', 'cmmi-ladder'],
    ['open-businesscase','open-profile','open-advice'],
    ['profiel','business','roadmap','advies'],
    { globalCapabilities: GLOBAL_CAPABILITIES, semanticInvariants: frozen(['capacity-not-cash','46-week-annualization']) }),

  profiel: capability('profiel', [
    ...ids('mw','uur'),
    frozen({legacyFieldId:'s-*', dynamicFrom:'DIM[13]', type:'range-1-5'})
  ], ['profile-vs-top-quartile','radar profile','value-per-maturity-step'],
  ['dimension-maturity','profile-average','manual-work-impact'], ['edit-dimension','edit-headcount','edit-hour-cost'], ['overzicht','business','dataai']),

  dataai: capability('data-ai', [],
    ['data-and-ai readiness','five implementation phases','change/adoption curve','TEI costs-benefits','CMMI maturity','Greiner growth phases','governance agreements'], ['data-ai-maturity','implementation-phase','change-readiness','cost-benefit-curve','governance-readiness', 'greiner-phase', 'greiner-ladder'],
    ['inspect-source-state','open-policy','open-businesscase'], ['profiel','beleid','business']),

  aiscan: capability('ai-scan', [
    ...ids('asTarief'),
    frozen({legacyFieldId:'asRijen:*', type:'repeatable-task', columns:frozen(['task','owner','hoursPerWeek','repetition','dataReadiness','errorRisk'])})
  ], ['AI opportunity matrix','per-task benefit/timing','benchmark checkpoint','priority order'],
  ['annual-task-cost','supportable-share','risk-adjusted-benefit','opportunity-score'],
  ['asToevoegen','asVoorbeeld','asLeeg','edit-task','prioritize-task'], ['cijfers','dataai','business']),

  invoeren: capability('gegevens-invullen', [
    frozen({legacyFieldId:'inCijfers:*', dynamicGroup:'company-financials'}),
    frozen({legacyFieldId:'inFin:*', dynamicGroup:'balance-financing'}),
    frozen({legacyFieldId:'inKlanten:*', dynamicGroup:'customers'}),
    frozen({legacyFieldId:'inMetingen:*', dynamicGroup:'measurements'}),
    frozen({legacyFieldId:'inBeleid:*', dynamicGroup:'policy-documents'}),
    frozen({legacyFieldId:'inEsg:*', dynamicGroup:'sustainability-csrd'})
  ], ['input-completion'], ['input-completeness','downstream-recalculation'], ['edit-all-inputs','save-progress'], ['antwoorden','cijfers','waarde','beleid','eindconclusie']),

  antwoorden: capability('ingevulde-gegevens', [frozen({legacyFieldId:'antwLijst:*', dynamicGroup:'all-scan-answers'})], ['answer review'], ['answer-completeness'], ['review-answer','edit-via-profile'], ['profiel','invoeren']),

  business: capability('businesscase', ids('bDoel','bUitstel','bInvest'),
    ['cumulative net result','adoption curve'], ['benefit-at-target-maturity','delay-cost','investment-net-result','payback', 'tei-summary'],
    ['change-target','change-delay','change-investment'], ['profiel','cijfers','roadmap']),

  cijfers: capability('cijfers-maatstaven', ids(
    'cOmzet','cBrutomarge','cEbitda','cLoon','cKlanten','cGrootste','cMarketing','cNieuw','cDso','cIt',
    'kNps','kTevreden','kHerhaal','kKlacht','mtDatum','mtSoort','mtWaarde','mtNotitie'
  ), ['KPI benchmark comparison','trusted-advisor ladder','productivity','measurements over time'], ['gross-margin','ebitda-margin','wage-ratio','marketing-ratio','it-ratio','dso','customer-concentration','productivity','measurement-trend', 'trusted-advisor-level', 'trusted-advisor-ladder'],
    ['mtToe','add-measurement','remove-measurement'], ['branche','waarde','mensen','business']),

  waarde: capability('waarde-financiering', ids('wSchuld','wCash','wEV','wBalans','wVast','wRente','wMultiple','wWacc'),
    ['EBITDA multiple','DCF perpetuity','DuPont','Altman Z','interest coverage','DSCR','break-even','sensitivity'], ['enterprise-value','equity-value','dcf','dupont','altman-z','interest-coverage','dscr','break-even','safety-margin','sensitivity', 'dupont-breakdown', 'ebitda-multiple'],
    ['edit-financial-assumptions'], ['cijfers','business','dd']),

  mensen: capability('mensen', ids('mVerzuim','mVerloop','mEnps','mMto','mVac'), ['people-vs-industry'],
    ['absence-gap','turnover-gap','enps-gap','mto-maturity','vacancy-pressure'], ['edit-people-metrics'], ['branche','profiel']),

  branche: capability('branche-markt', ids('bKeuze','bOmzet'), ['industry-position','economic context','regulatory context'],
    ['industry-benchmark-deltas','industry-growth-context'], ['change-industry','change-revenue'], ['cijfers','mensen','onderzoek']),

  onderzoek: capability('onderzoek', [frozen({legacyFieldId:'ondFilter:*', dynamicGroup:'research-filter'})],
    ['four-quadrant maturity/cost','cost-of-doing-nothing ladder','research evidence cards'],
    ['maturity-vs-cost-position','do-nothing-cost'], ['filter-research','open-source'], ['profiel','business','branche']),

  beleid: capability('compliance-governance', [
    frozen({legacyFieldId:'esgVelden:*', dynamicGroup:'11-esg-topics'}),
    frozen({legacyFieldId:'beleidLijst:*', dynamicGroup:'policy-status'})
  ], ['technology state','governance maturity','CSRD readiness','policy-document state','deadlines/fines','incident plan'],
    ['technology-readiness','governance-maturity','esg-readiness','policy-completeness','compliance-risk'],
    ['edit-esg-topic','edit-policy-state','inspect-deadline','inspect-incident-plan'], ['invoeren','dataai','cijfers']),

  aicap: capability('ai-capabilities', [frozen({legacyFieldId:'aicap:*', dynamicGroup:'ai-capabilities'})], ['AI capability maturity'],
    ['ai-capability-readiness','ai-capability-gap'], ['assess-capability','prioritize-capability'], ['dataai','beleid','dna']),

  strategie: capability('strategie-naar-maandagochtend', ids('kHorizon','kMin'),
    ['all-model findings matrix','strategy conclusion','filtered recommendation map'],
    ['model-finding-value','model-finding-horizon','priority-filter'], ['filter-horizon','filter-minimum-value','add-finding-to-roadmap'], ['canvassen','eindconclusie','roadmap','dna']),

  canvassen: capability('canvassen', [frozen({legacyFieldId:'canvasKaarten:*', dynamicGroup:'six-editable-canvases'})],
    ['six legacy canvases','canvas conclusion'], ['canvas-completeness','canvas-consensus'], ['edit-canvas-cell','save-canvas'], ['strategie','eindconclusie']),

  eindconclusie: capability('eindconclusie', [], ['source consensus','value-vs-duration matrix','five recommendations','calculation explanation'],
    ['cross-source-consensus','recommendation-priority','final-synthesis'], ['open-recommendation','open-source-evidence'], ['strategie','canvassen','cijfers','advies']),

  dd: capability('due-diligence', [frozen({legacyFieldId:'ddInhoud:*', dynamicGroup:'due-diligence-dossier'})],
    ['due-diligence dossier','exit-readiness'], ['dd-readiness','materiality','red-flags','transferability'], ['review-dd-item','link-evidence','create-action'], ['waarde','mensen','beleid','documenten']),

  dna: capability('strategy-dna', ids('dnaVrij','dnaZoek','ecNaam','ecDim','ecAfd','ecProc','ecData','ecSys','ecAi','ecGov','ecKpi','ecProj','ecThema'),
    ['strategy theme graph','department impact','capability maturity','change agenda','free-text strategy translation','relationship Q&A','seven-layer thermometer','building-block library','custom building blocks'],
    ['theme-impact','capability-maturity','change-sequencing','layer-maturity'],
    ['dnaVrijOk','ask-relationship-question','search-library','ecToe','add-custom-building-block'], ['profiel','strategie','roadmap']),

  bijhouden: capability('actueel-houden', ids('bsWat','bsWaarom','bsDatum','bsDoor','bsRaakt','dcNaam','dcBij','dcDatum'),
    ['ownership/freshness table','decision log','document register','change-to-tasks','change log'],
    ['freshness','expired-items','ownership-completeness'], ['bsToe','dcToe','record-decision','link-document','generate-change-tasks'], ['wijzigingen','roadmap','advies']),

  wijzigingen: capability('wijzigingen', [frozen({legacyFieldId:'wijzigingen:*', dynamicGroup:'change-events'})], ['change history','impact by department'],
    ['change-impact','follow-up-status'], ['record-change','inspect-impact','create-follow-up'], ['bijhouden','roadmap','advies']),

  advies: capability('advies', [frozen({legacyFieldId:'modelKeuze:*', dynamicGroup:'model-filter'})], ['prioritized advice list','model contribution counter','calculation explanation'],
    ['advice-priority','benefit-per-duration','cross-model-weight'], ['select-model','add-advice-to-roadmap','open-rationale'], ['eindconclusie','roadmap','offerte']),

  offerte: capability('offerte', [frozen({legacyFieldId:'offerte:*', dynamicGroup:'offer-config'})], ['package/sprint offer','pricing','delivery story','acceptance/start flow'],
    ['offer-total','weekly-price','end-price'], ['configure-offer','select-package','confirm-start'], ['advies','roadmap','business']),

  roadmap: capability('roadmap', ids('nTitel','nDim','nStart','nDuur'), ['12-month gantt','roadmap progress'],
    ['timeline-position','duration','completion-progress','roadmap-value'], ['nToe','nVoorstel','add-item','drag-item','toggle-complete','remove-item'], ['advies','strategie','bijhouden','eindconclusie']),
});

const REQUIRED_KEYS = frozen([
  'overzicht','profiel','dataai','aiscan','invoeren','antwoorden','business','cijfers','waarde','mensen','branche','onderzoek',
  'beleid','aicap','strategie','canvassen','eindconclusie','dd','dna','bijhouden','wijzigingen','advies','offerte','roadmap'
]);

export function assertFunctionalInventoryComplete() {
  const keys = Object.keys(LEGACY_FUNCTIONAL_INVENTORY).sort();
  const expected = [...REQUIRED_KEYS].sort();
  if (keys.join('|') !== expected.join('|')) throw new Error('Functional inventory does not cover the 24 protected legacy capabilities');
  for (const [id, item] of Object.entries(LEGACY_FUNCTIONAL_INVENTORY)) {
    if (!item.v2Page) throw new Error(`Incomplete functional inventory: ${id}.v2Page`);
    for (const key of ['fields','models','calculations','actions','dependencies']) {
      if (!Array.isArray(item[key])) throw new Error(`Incomplete functional inventory: ${id}.${key}`);
    }
  }
  if (!LEGACY_FUNCTIONAL_INVENTORY.overzicht.globalCapabilities?.length) throw new Error('Global capabilities are not inventoried');
  return true;
}

export const LEGACY_FUNCTIONAL_INVENTORY_VERSION = '2026-09-09-v1';
