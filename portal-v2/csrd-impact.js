export const CSRD_TABS = Object.freeze([
  ['all','Totaal'],['climate','CO₂ & Klimaat'],['water','Water'],['circularity','Circulariteit'],['social','Social'],['governance','Governance']
]);

export const DEFAULT_IMPACT_SNAPSHOT = Object.freeze({
  period:'2026 (YTD)', impactScore:83, impactDelta:12, readiness:76,
  metrics:{
    climate:{label:'CO₂',value:'-42%',sub:'t.o.v. 2022',icon:'☁',tone:'green'},
    water:{label:'Water',value:'-28%',sub:'verbruik per FTE',icon:'●',tone:'blue'},
    circularity:{label:'Circulariteit',value:'78%',sub:'circulair',icon:'♻',tone:'green'},
    social:{label:'Social',value:'9,1',sub:'medewerkertevredenheid',icon:'●',tone:'amber'},
    governance:{label:'Governance',value:'100%',sub:'compliance op koers',icon:'▥',tone:'blue'}
  },
  readinessItems:[['Dubbele materialiteit',true],['ESRS datapunten',false],['Ketenanalyse',true],['Rapportage & audit',false]],
  realtime:[['⚡','12,4 kWh','energieverbruik (voorbeeld)'],['☁','2,1 kg','CO₂-uitstoot (voorbeeld)'],['●','183 liter','waterverbruik (voorbeeld)'],['⌁','98%','hernieuwbare energie (voorbeeld)']],
  social:[['Medewerkertevredenheid','9,1','+0,8'],['Diversiteit (v/m/x)','32%','+6%'],['Uren maatschappelijke inzet','1.240','+28%'],['Ziekteverzuim','3,7%','-1,2%']],
  actions:[['climate','Verlaag CO₂ met 20%','Hoog'],['water','Bespaar 30% water','Hoog'],['social','Verhoog medewerker­geluk','Middel'],['circularity','Word 100% circulair','Middel']],
  internal:{dataQuality:'84%',openEvidence:17,lastValidation:'08-09-2026 10:42'},
  demo:true
});

export const UNKNOWN_LIVE_IMPACT_SNAPSHOT = Object.freeze({
  period:'Actuele tenantcontext', impactScore:'—', impactDelta:'—', readiness:'—', liveUnknown:true,
  metrics:{
    climate:{label:'CO₂',value:'onbekend',sub:'geen live meting',icon:'☁',tone:'green'},
    water:{label:'Water',value:'onbekend',sub:'geen live meting',icon:'●',tone:'blue'},
    circularity:{label:'Circulariteit',value:'onbekend',sub:'geen live meting',icon:'♻',tone:'green'},
    social:{label:'Social',value:'onbekend',sub:'geen live meting',icon:'●',tone:'amber'},
    governance:{label:'Governance',value:'onbekend',sub:'evidence nog niet compleet',icon:'▥',tone:'blue'}
  },
  readinessItems:[['Dubbele materialiteit',false],['ESRS datapunten',false],['Ketenanalyse',false],['Rapportage & audit',false]],
  realtime:[['⚡','onbekend','energie · geen live meting'],['☁','onbekend','CO₂e · geen live meting'],['●','onbekend','water · geen live meting'],['⌁','0%','brondekking']],
  social:[['Medewerkertevredenheid','onbekend','—'],['Diversiteit (v/m/x)','onbekend','—'],['Uren maatschappelijke inzet','onbekend','—'],['Ziekteverzuim','onbekend','—']],
  actions:[],
  internal:{dataQuality:'onbekend',openEvidence:0,lastValidation:'geen live meting'},
  resourceIntelligence:{resourceRows:0,businessValueRows:0,complianceEvidence:0,recommendations:0,truthPolicy:'measured_or_evidence_backed_else_unknown'},
  demo:false
});

const nl=(value,digits=1)=>value==null?'onbekend':Number(value).toLocaleString('nl-NL',{maximumFractionDigits:digits});
const finiteOrNull=value=>value===null||value===undefined||value===''?null:(Number.isFinite(Number(value))?Number(value):null);
const cleanEvidenceList=value=>[...new Set((Array.isArray(value)?value:[]).map(item=>String(item??'').trim()).filter(Boolean))];
const validTimestamp=value=>{const raw=String(value??'').trim();return raw&&Number.isFinite(Date.parse(raw))?raw:'';};
const arr=value=>Array.isArray(value)?value:[];

export function withBusinessValueEvidence(summary={},base={}){
  const observations=Math.max(0,Number(summary.observations)||0);
  const observedCostEur=finiteOrNull(summary.observed_cost_eur);
  const realizedRevenueEur=finiteOrNull(summary.realized_revenue_eur);
  const realizedRoi=finiteOrNull(summary.realized_roi);
  const actionAttributionCoverage=finiteOrNull(summary.action_attribution_coverage);
  const environmentalFactorCoverage=finiteOrNull(summary.environmental_factor_coverage);
  const latestObservedAt=summary.latest_observed_at||null;
  const evidenceClass=observations>0&&(observedCostEur!==null||realizedRevenueEur!==null||realizedRoi!==null)?'measured':'unknown';
  return {
    ...structuredClone(base),
    businessValue:{observedCostEur,realizedRevenueEur,realizedRoi,observations,actionAttributionCoverage,environmentalFactorCoverage,latestObservedAt,evidenceClass,source:'powerhouse_portal_resource_summary_v2'}
  };
}

export function withResourceIntelligence(intelligence={},base=UNKNOWN_LIVE_IMPACT_SNAPSHOT){
  const resourceRows=arr(intelligence.resource_daily);
  const businessRows=arr(intelligence.business_value);
  const compliance=arr(intelligence.compliance_evidence);
  const recommendations=arr(intelligence.recommendations);
  const actions=recommendations.slice(0,4).map(item=>['governance',String(item?.proposed_action?.action||item?.opportunity_type||'Optimaliseer resourcegebruik'),item?.safety_class==='safe_reversible'?'Middel':'Review']);
  return {
    ...structuredClone(base),
    actions,
    resourceIntelligence:{
      resourceRows:resourceRows.length,businessValueRows:businessRows.length,complianceEvidence:compliance.length,recommendations:recommendations.length,
      truthPolicy:intelligence.truth_policy||'measured_or_evidence_backed_else_unknown',freshness:intelligence.freshness||{}
    },
    internal:{...(base.internal||{}),openEvidence:compliance.filter(item=>item.evidence_status!=='evidence_present'&&item.evidence_status!=='not_applicable').length}
  };
}

export function withResourceFootprint(footprint={},base=DEFAULT_IMPACT_SNAPSHOT){
  const coverage=Math.max(0,Math.min(1,Number(footprint.coverage)||0));
  const confidence=Math.max(0,Math.min(1,Number(footprint.confidence)||0));
  const calculatedAt=validTimestamp(footprint.calculatedAt);
  const factorVersions=cleanEvidenceList(footprint.factorVersions);
  const methodologies=cleanEvidenceList(footprint.methodologies);
  const sources=cleanEvidenceList(footprint.sources);
  const calculationStatus=String(footprint.calculationStatus||'').trim().toLowerCase();
  const hasCanonicalEvidence=coverage>0&&confidence>0&&Boolean(calculatedAt)&&factorVersions.length>0&&methodologies.length>0&&sources.length>0&&calculationStatus==='calculated';
  if(!hasCanonicalEvidence) return structuredClone(base);
  return {
    ...structuredClone(base),liveUnknown:false,demo:false,
    realtime:[
      ['⚡',footprint.energyKwh==null?'onbekend':`${nl(footprint.energyKwh)} kWh`,'energie · berekend uit bronverbruik'],
      ['☁',footprint.co2eKg==null?'onbekend':`${nl(footprint.co2eKg)} kg`,'CO₂e · factor-gebaseerd'],
      ['●',footprint.waterLiters==null?'onbekend':`${nl(footprint.waterLiters,0)} liter`,'waterimpact · factor-gebaseerd'],
      ['⌁',`${Math.round(coverage*100)}%`,'brondekking']
    ],
    resourceFootprint:{dataBacked:true,coverage,confidence,calculatedAt,factorVersions,methodologies,sources,calculationStatus,measurementClass:footprint.measurementClass||'calculated'},
    internal:{...(base.internal||{}),dataQuality:`${Math.round(coverage*100)}%`,lastValidation:new Date(calculatedAt).toLocaleString('nl-NL'),footprintConfidence:`${Math.round(confidence*100)}%`}
  };
}

export function impactSnapshotFromPortalState(state={}){
  const resourceBusinessValue=state?.resourceBusinessValue;
  if(!resourceBusinessValue) return structuredClone(DEFAULT_IMPACT_SNAPSHOT);
  const intelligence=resourceBusinessValue.resource_intelligence||{};
  const liveBase=withResourceIntelligence(intelligence,withBusinessValueEvidence(resourceBusinessValue,UNKNOWN_LIVE_IMPACT_SNAPSHOT));
  const footprint=resourceBusinessValue.resource_footprint;
  return footprint&&typeof footprint==='object'?withResourceFootprint(footprint,liveBase):liveBase;
}

export function customerSafeSnapshot(snapshot=DEFAULT_IMPACT_SNAPSHOT){ const {internal,...safe}=snapshot; return structuredClone(safe); }
function meter(value,label,sub='van 100'){const numeric=Number(value);const score=Number.isFinite(numeric)?numeric:0;return `<div class="csrd-meter" style="--score:${score}"><div class="csrd-meter-ring"><strong>${value}</strong><span>${sub}</span></div><p>${label}</p></div>`;}
function metricCard([id,m]){return `<article class="csrd-float metric-${id}" data-domain="${id}"><span class="csrd-metric-icon ${m.tone}">${m.icon}</span><div><small>${m.label}</small><strong>${m.value}</strong><span>${m.sub}</span></div></article>`;}
function mobileDomainCard([id,m]){const descriptions={climate:'Uitstoot en bewijs worden alleen getoond als brondata beschikbaar zijn.',water:'Waterimpact blijft onbekend totdat brondata en methodiek aantoonbaar zijn.',circularity:'Circulariteit wordt pas beoordeeld met aantoonbare materiaal- en ketendata.',social:'Sociale impact wordt pas als score getoond met onderliggende evidence.',governance:'Governance toont evidence-dekking en open controls, niet een juridisch totaalvinkje.'};return `<article class="csrd-mobile-domain" data-domain="${id}"><div class="domain-head"><span class="domain-icon">${m.icon}</span><div><small>${m.label}</small><strong>${m.value}</strong><small>${m.sub}</small></div></div><p>${descriptions[id]}</p><button type="button" data-csrd-focus="${id}">Bekijk ${m.label.toLowerCase()} →</button></article>`;}
function sparkBars(values=[82,70,58,42,32]){return `<div class="csrd-bars">${values.map((v,i)=>`<i style="--h:${v}%" title="${2021+i}: ${v}"></i>`).join('')}</div>`}
function readiness(snapshot){return snapshot.readinessItems.map(([label,done])=>`<li><span class="${done?'done':'todo'}">${done?'✓':'○'}</span>${label}</li>`).join('')}

export function csrdImpactMarkup(snapshot=DEFAULT_IMPACT_SNAPSHOT,{customerView=false}={}){
  const data=customerView?customerSafeSnapshot(snapshot):snapshot;
  const footprint=data.resourceFootprint;
  const realtimeStatus=footprint?.dataBacked?`Data-backed · ${Math.round(footprint.coverage*100)}% brondekking`:data.liveUnknown?'Live tenantcontext · geen live meting':'Voorbeelddata · geen live claim';
  const footprintEvidence=!customerView&&footprint?.dataBacked?`<span>Footprint confidence ${Math.round(footprint.confidence*100)}%</span><span>Factoren ${footprint.factorVersions.join(', ')||'onbekend'}</span>`:'';
  const intelligenceEvidence=!customerView&&data.resourceIntelligence?`<span>${data.resourceIntelligence.resourceRows} resourcegroepen</span><span>${data.resourceIntelligence.complianceEvidence} compliance-evidence-items</span><span>${data.resourceIntelligence.recommendations} optimalisatie-adviezen</span>`:'';
  const delta=Number.isFinite(Number(data.impactDelta))?`↑ +${data.impactDelta} t.o.v. vorig jaar`:'Nog geen bewezen trend';
  const historical=data.liveUnknown?'<p>Nog geen historische meetreeks met voldoende bewijs.</p>':sparkBars([84,65,49,37,31]);
  return `<div class="csrd-cockpit" data-customer-view="${customerView}">
    <header class="csrd-top"><div><span class="csrd-kicker">CSRD & Impact</span><h2>Vandaag maken we morgen tastbaar.</h2><p>Inzicht. Actie. Impact. Voor jouw bedrijf, je mensen en de wereld.</p></div><div class="csrd-controls"><label>Bedrijf<select aria-label="Bedrijf"><option>${data.demo?'Demo MKB B.V.':'Actuele organisatie'}</option></select></label><label>Periode<select aria-label="Periode"><option>${data.period}</option></select></label><button class="csrd-outline" type="button" data-csrd-customer>${customerView?'Interne weergave':'Klantweergave'} ↗</button><button class="csrd-outline" type="button" data-csrd-benchmark>Vergelijk met sector</button><button class="csrd-outline csrd-close" type="button" data-csrd-close aria-label="Sluit CSRD dashboard">×</button></div></header>
    <nav class="csrd-tabs" aria-label="Impact domeinen">${CSRD_TABS.map(([id,label],i)=>`<button type="button" class="${i===0?'active':''}" data-csrd-tab="${id}">${label}</button>`).join('')}</nav>
    <section class="csrd-mobile-summary" aria-label="Mobiele CSRD samenvatting"><article><small>Totale impactscore</small><strong>${data.impactScore}${data.impactScore==='—'?'':'/100'}</strong><span>${delta}</span></article><article><small>CSRD readiness</small><strong>${data.readiness}${data.readiness==='—'?'':'%'}</strong><span>Evidence-gebaseerde rapportagegereedheid</span></article><article><small>Prioriteit</small><strong>${data.actions.length}</strong><span>Open resource-adviezen</span></article></section>
    <section class="csrd-stage"><aside class="csrd-score-card">${meter(data.impactScore,'Onze totale impactscore')}<div class="csrd-delta"><span>${delta}</span></div><p class="csrd-course">⌁ Alleen bewezen impact wordt als score getoond</p></aside><div class="csrd-world"><div class="csrd-sky"></div><div class="csrd-sun"></div><div class="csrd-hills"></div><div class="csrd-city"></div><div class="csrd-river"></div><div class="csrd-wind w1">✣</div><div class="csrd-wind w2">✣</div><div class="csrd-solar">▦ ▦ ▦</div><div class="csrd-building"><span>BEDRIJFSGEHEUGEN</span></div><div class="csrd-worldcopy"><strong>Je impact in één oogopslag.</strong><br><small>Van klimaat en water tot social, governance en bewijs.</small></div>${Object.entries(data.metrics).map(metricCard).join('')}<div class="csrd-orbit">PEOPLE <b>+</b> PLANET <b>+</b> PROGRESS</div></div><aside class="csrd-side"><article class="csrd-panel readiness"><div class="csrd-panelhead"><h3>CSRD Readiness</h3><span>readiness-overzicht · evidence-gebaseerd</span></div><div class="csrd-readyrow">${meter(data.readiness,'','%')}<p>Geen juridisch totaalvinkje; alleen aantoonbare dekking</p></div><ul>${readiness(data)}</ul><button type="button" data-csrd-open="audit">Bekijk details →</button></article><article class="csrd-panel"><div class="csrd-panelhead"><h3>Impact in real time</h3><span>${realtimeStatus}</span></div><div class="csrd-live">${data.realtime.map(([ic,v,s])=>`<div><i>${ic}</i><span><b>${v}</b><small>${s}</small></span></div>`).join('')}</div></article></aside></section>
    <section class="csrd-mobile-domains" aria-label="Impact per domein">${Object.entries(data.metrics).map(mobileDomainCard).join('')}</section>
    <section class="csrd-grid"><article class="csrd-panel domain-card" data-domain="climate"><h3>CO₂-uitstoot</h3>${historical}<footer><span>${data.liveUnknown?'Geen bewezen historie':'2021'}</span><b>${data.liveUnknown?'Wacht op telemetry':'Doel 2030'}</b></footer></article><article class="csrd-panel domain-card" data-domain="water"><h3>Waterverbruik</h3>${data.liveUnknown?'<p>Nog geen historische meetreeks met voldoende bewijs.</p>':sparkBars([90,71,54,39,28])}<footer><span>${data.liveUnknown?'Geen bewezen historie':'2021'}</span><b>${data.liveUnknown?'Wacht op telemetry':'Doel 2030'}</b></footer></article><article class="csrd-panel domain-card social-card" data-domain="social"><h3>Social impact</h3>${data.social.map(([l,v,d])=>`<div><span>${l}</span><b>${v}</b><em class="${String(d).startsWith('-')?'down':''}">${d}</em></div>`).join('')}</article><article class="csrd-panel domain-card circular-card" data-domain="circularity"><h3>Circulariteit</h3><div class="csrd-circle"><strong>${data.metrics.circularity.value}</strong></div><ul><li>Brondata</li><li>Materiaalstromen</li><li>Ketenbewijs</li><li>Methodiek</li></ul></article></section>
    <section class="csrd-actionbar"><div><span class="csrd-leaf">⌁</span><p><b>Samen versnellen?</b><small>Aanbevelingen ontstaan uit gemeten inefficiëntie en evidence-gaten.</small></p></div>${data.actions.map(([domain,label,prio])=>`<button type="button" data-domain="${domain}" data-csrd-open="actieve-acties"><span>${label}</span><small>${prio}</small></button>`).join('')}<button class="primary" type="button" data-csrd-open="actieve-acties">Bekijk alle acties →</button></section>
    ${customerView?'':`<section class="csrd-evidence"><b>Datakwaliteit ${data.internal.dataQuality}</b><span>${data.internal.openEvidence} open evidence-items</span><span>Laatst gevalideerd ${data.internal.lastValidation}</span>${footprintEvidence}${intelligenceEvidence}<button type="button" data-csrd-open="outcomes-evidence">Evidence & audittrail →</button></section>`}
  </div>`;
}

export function renderCsrdImpact(root,{openPage=()=>{},closePage=()=>{},snapshot=DEFAULT_IMPACT_SNAPSHOT}={}){
  let customerView=false;
  const render=()=>{root.innerHTML=csrdImpactMarkup(snapshot,{customerView});root.querySelector('[data-csrd-close]')?.addEventListener('click',closePage);root.querySelector('[data-csrd-customer]')?.addEventListener('click',()=>{customerView=!customerView;render()});root.querySelector('[data-csrd-benchmark]')?.addEventListener('click',()=>openPage('cijfers-maatstaven'));root.querySelectorAll('[data-csrd-open]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.csrdOpen)));root.querySelectorAll('[data-csrd-focus]').forEach(btn=>btn.addEventListener('click',()=>{const domain=btn.dataset.csrdFocus;const tab=root.querySelector(`[data-csrd-tab="${domain}"]`);tab?.click();tab?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});}));root.querySelectorAll('[data-csrd-tab]').forEach(btn=>btn.addEventListener('click',()=>{root.querySelectorAll('[data-csrd-tab]').forEach(x=>x.classList.toggle('active',x===btn));const domain=btn.dataset.csrdTab;root.querySelectorAll('[data-domain]').forEach(card=>card.classList.toggle('csrd-muted',domain!=='all'&&card.dataset.domain!==domain));}));};
  render();
}
