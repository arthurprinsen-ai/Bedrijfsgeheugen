export const CSRD_TABS = Object.freeze([
  ['all','Totaal'],['climate','CO₂ & Klimaat'],['water','Water'],['circularity','Circulariteit'],['social','Social'],['governance','Governance']
]);

export const DEFAULT_IMPACT_SNAPSHOT = Object.freeze({
  period:'2025 (YTD)',
  impactScore:83,
  impactDelta:12,
  readiness:76,
  metrics:{
    climate:{label:'CO₂',value:'-42%',sub:'t.o.v. 2022',icon:'☁',tone:'green'},
    water:{label:'Water',value:'-28%',sub:'verbruik per FTE',icon:'●',tone:'blue'},
    circularity:{label:'Circulariteit',value:'78%',sub:'circulair',icon:'♻',tone:'green'},
    social:{label:'Social',value:'9,1',sub:'medewerkertevredenheid',icon:'●',tone:'amber'},
    governance:{label:'Governance',value:'100%',sub:'compliance op koers',icon:'▥',tone:'blue'}
  },
  readinessItems:[
    ['Dubbele materialiteit',true],['ESRS datapunten',false],['Ketenanalyse',true],['Rapportage & audit',false]
  ],
  realtime:[
    ['⚡','12,4 kWh','energieverbruik (voorbeeld)'],['☁','2,1 kg','CO₂-uitstoot (voorbeeld)'],['●','183 liter','waterverbruik (voorbeeld)'],['⌁','98%','hernieuwbare energie (voorbeeld)']
  ],
  social:[['Medewerkertevredenheid','9,1','+0,8'],['Diversiteit (v/m/x)','32%','+6%'],['Uren maatschappelijke inzet','1.240','+28%'],['Ziekteverzuim','3,7%','-1,2%']],
  actions:[
    ['climate','Verlaag CO₂ met 20%','Hoog'],['water','Bespaar 30% water','Hoog'],['social','Verhoog medewerker­geluk','Middel'],['circularity','Word 100% circulair','Middel']
  ],
  internal:{dataQuality:'84%',openEvidence:17,lastValidation:'08-09-2026 10:42'}
});

export function customerSafeSnapshot(snapshot=DEFAULT_IMPACT_SNAPSHOT){
  const { internal, ...safe } = snapshot;
  return structuredClone(safe);
}

function meter(value, label, sub='van 100'){
  return `<div class="csrd-meter" style="--score:${Number(value)}"><div class="csrd-meter-ring"><strong>${value}</strong><span>${sub}</span></div><p>${label}</p></div>`;
}
function metricCard([id,m]){
  return `<article class="csrd-float metric-${id}" data-domain="${id}"><span class="csrd-metric-icon ${m.tone}">${m.icon}</span><div><small>${m.label}</small><strong>${m.value}</strong><span>${m.sub}</span></div></article>`;
}
function sparkBars(values=[82,70,58,42,32]){return `<div class="csrd-bars">${values.map((v,i)=>`<i style="--h:${v}%" title="${2021+i}: ${v}"></i>`).join('')}</div>`}
function readiness(snapshot){return snapshot.readinessItems.map(([label,done])=>`<li><span class="${done?'done':'todo'}">${done?'✓':'○'}</span>${label}</li>`).join('')}

export function csrdImpactMarkup(snapshot=DEFAULT_IMPACT_SNAPSHOT,{customerView=false}={}){
  const data=customerView?customerSafeSnapshot(snapshot):snapshot;
  return `<div class="csrd-cockpit" data-customer-view="${customerView}">
    <header class="csrd-top">
      <div><span class="csrd-kicker">CSRD & Impact</span><h2>Vandaag maken we morgen tastbaar.</h2><p>Inzicht. Actie. Impact. Voor jouw bedrijf, je mensen en de wereld.</p></div>
      <div class="csrd-controls"><label>Bedrijf<select aria-label="Bedrijf"><option>Demo MKB B.V.</option></select></label><label>Periode<select aria-label="Periode"><option>${data.period}</option></select></label><button class="csrd-outline" type="button" data-csrd-customer>${customerView?'Interne weergave':'Klantweergave'} ↗</button><button class="csrd-outline" type="button" data-csrd-benchmark>Vergelijk met sector</button></div>
    </header>
    <nav class="csrd-tabs" aria-label="Impact domeinen">${CSRD_TABS.map(([id,label],i)=>`<button type="button" class="${i===0?'active':''}" data-csrd-tab="${id}">${label}</button>`).join('')}</nav>
    <section class="csrd-stage">
      <aside class="csrd-score-card">${meter(data.impactScore,'Onze totale impactscore')}<div class="csrd-delta">↑ +${data.impactDelta} <span>t.o.v. vorig jaar</span></div><p class="csrd-course">⌁ Op koers naar een toekomstbestendig bedrijf</p></aside>
      <div class="csrd-world">
        <div class="csrd-sky"></div><div class="csrd-sun"></div><div class="csrd-hills"></div><div class="csrd-city"></div><div class="csrd-river"></div><div class="csrd-wind w1">✣</div><div class="csrd-wind w2">✣</div><div class="csrd-solar">▦ ▦ ▦</div>
        <div class="csrd-building"><span>BEDRIJFSGEHEUGEN</span></div>
        <div class="csrd-worldcopy"><strong>Een veerkrachtige wereld<br>begint bij wat je vandaag doet.</strong></div>
        ${Object.entries(data.metrics).map(metricCard).join('')}
        <div class="csrd-orbit">PEOPLE <b>+</b> PLANET <b>+</b> PROGRESS</div>
      </div>
      <aside class="csrd-side">
        <article class="csrd-panel readiness"><div class="csrd-panelhead"><h3>CSRD Readiness</h3><span>readiness-overzicht</span></div><div class="csrd-readyrow">${meter(data.readiness,'','%')}<p>Op weg naar volledige rapportage</p></div><ul>${readiness(data)}</ul><button type="button" data-csrd-open="audit">Bekijk details →</button></article>
        <article class="csrd-panel"><div class="csrd-panelhead"><h3>Impactmetingen</h3><span>Voorbeelddata</span></div><div class="csrd-live">${data.realtime.map(([ic,v,s])=>`<div><i>${ic}</i><span><b>${v}</b><small>${s}</small></span></div>`).join('')}</div></article>
      </aside>
    </section>
    <section class="csrd-grid">
      <article class="csrd-panel domain-card" data-domain="climate"><h3>CO₂-uitstoot <small>(ton CO₂e)</small></h3>${sparkBars([84,65,49,37,31])}<footer><span>2021</span><span>2022</span><span>2023</span><span>2024</span><b>Doel 2030</b></footer></article>
      <article class="csrd-panel domain-card" data-domain="water"><h3>Waterverbruik <small>(m³)</small></h3>${sparkBars([90,71,54,39,28])}<footer><span>2021</span><span>2022</span><span>2023</span><span>2024</span><b>Doel 2030</b></footer></article>
      <article class="csrd-panel domain-card social-card" data-domain="social"><h3>Social impact</h3>${data.social.map(([l,v,d])=>`<div><span>${l}</span><b>${v}</b><em class="${d.startsWith('-')?'down':''}">${d}</em></div>`).join('')}</article>
      <article class="csrd-panel domain-card circular-card" data-domain="circularity"><h3>Circulariteit</h3><div class="csrd-circle"><strong>78%</strong></div><ul><li>Herbruikbaar</li><li>Recycling</li><li>Biobased</li><li>Nog te gaan</li></ul></article>
    </section>
    <section class="csrd-actionbar"><div><span class="csrd-leaf">⌁</span><p><b>Samen versnellen?</b><small>Ontdek welke acties de grootste impact hebben voor jouw organisatie.</small></p></div>${data.actions.map(([domain,label,prio])=>`<button type="button" data-domain="${domain}" data-csrd-open="actieve-acties"><span>${label}</span><small>${prio}</small></button>`).join('')}<button class="primary" type="button" data-csrd-open="actieve-acties">Bekijk alle acties →</button></section>
    ${customerView?'':`<section class="csrd-evidence"><b>Datakwaliteit ${data.internal.dataQuality}</b><span>${data.internal.openEvidence} open evidence-items</span><span>Laatst gevalideerd ${data.internal.lastValidation}</span><button type="button" data-csrd-open="outcomes-evidence">Evidence & audittrail →</button></section>`}
  </div>`;
}

export function renderCsrdImpact(root,{openPage=()=>{},snapshot=DEFAULT_IMPACT_SNAPSHOT}={}){
  let customerView=false;
  const render=()=>{
    root.innerHTML=csrdImpactMarkup(snapshot,{customerView});
    root.querySelector('[data-csrd-customer]')?.addEventListener('click',()=>{customerView=!customerView;render()});
    root.querySelector('[data-csrd-benchmark]')?.addEventListener('click',()=>openPage('cijfers-maatstaven'));
    root.querySelectorAll('[data-csrd-open]').forEach(btn=>btn.addEventListener('click',()=>openPage(btn.dataset.csrdOpen)));
    root.querySelectorAll('[data-csrd-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      root.querySelectorAll('[data-csrd-tab]').forEach(x=>x.classList.toggle('active',x===btn));
      const domain=btn.dataset.csrdTab;
      root.querySelectorAll('[data-domain]').forEach(card=>card.classList.toggle('csrd-muted',domain!=='all'&&card.dataset.domain!==domain));
    }));
  };
  render();
}
