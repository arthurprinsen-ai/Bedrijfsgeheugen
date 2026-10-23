/**
 * Read-only Agent Intelligence projection over the existing, authenticated
 * Powerhouse operating-loop read model. No second scheduler, ledger or writer.
 * Observed activity is never promoted to verified business improvement.
 */
const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const items = value => Array.isArray(value) ? value : [];
const validTime = value => {
  const n = Date.parse(String(value || ''));
  return Number.isFinite(n) ? n : null;
};
const isoDay = time => new Date(time).toISOString().slice(0, 10);
const sourceDefinitions = Object.freeze([
  {id:'github',label:'GitHub · code & CI',pattern:/github|pull.request|workflow|commit|codeql/i},
  {id:'supabase',label:'Supabase · data & bewijs',pattern:/supabase|postgres|database|edge.function|migration/i},
  {id:'notion',label:'Notion · kennis',pattern:/notion/i},
  {id:'netlify',label:'Netlify · release',pattern:/netlify/i}
]);
const safeProofLink = value => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' &&
      ['github.com','app.netlify.com','supabase.com','app.supabase.com'].includes(url.hostname)
      ? url.href : '';
  } catch { return ''; }
};
const isFailure = event => /fail|error|block|breach|cancel|drift|timeout|critical/i.test(
  [event.status,event.severity].join(' ')
);
const isLearning = event => /learning|knowledge|memory|writeback|skill|projection/i.test(
  [event.category,event.rawType,event.layer].join(' ')
);

/**
 * Metrics describe only events included in the server readback. Event counts
 * are not customer outcomes, causal lifts or evidence of a healthy connector.
 */
export function deriveLearningTelemetry({events=[],runtime={},days=7,now=Date.now()}={}){
  const windowDays = Math.min(30,Math.max(1,Number.isInteger(days)?days:7));
  const nowMs = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const todayUtc = Date.parse(isoDay(nowMs)+'T00:00:00Z');
  const start = todayUtc-(windowDays-1)*86400000;
  const series = Array.from({length:windowDays},(_,i)=>({
    day:isoDay(start+i*86400000),observed:0,failures:0,learning:0
  }));
  const byDay = new Map(series.map(day=>[day.day,day]));
  const sourceRows=sourceDefinitions.map(source=>({
    id:source.id,label:source.label,observations:0,latest:null
  }));
  const seen=new Set();
  let undated=0;
  for(const event of items(events)){
    if(!event||typeof event!=='object')continue;
    const key=[event.id,event.occurredAt,event.title,event.status].map(String).join('|');
    if(seen.has(key))continue;
    seen.add(key);
    const at=validTime(event.occurredAt);
    if(at===null){undated++;continue;}
    if(at<start||at>nowMs+60000)continue;
    const bucket=byDay.get(isoDay(at));
    if(!bucket)continue;
    bucket.observed++;
    if(isFailure(event))bucket.failures++;
    if(isLearning(event))bucket.learning++;
    // A source hit means only that a reference was observed, not that
    // platform credentials, sync freshness or delivery succeeded.
    const descriptor=[event.source,event.layer].map(String).join(' ');
    for(let i=0;i<sourceDefinitions.length;i++){
      if(sourceDefinitions[i].pattern.test(descriptor)){
        sourceRows[i].observations++;
        sourceRows[i].latest=Math.max(sourceRows[i].latest||0,at);
      }
    }
  }
  const memories=items(runtime?.learning?.items);
  // A runtime item's own PROVEN flag and a syntactically valid URL are claims,
  // not independent provider readbacks. Preserve references for investigation,
  // but never promote them to independently validated production evidence.
  const referencedMemories=memories.filter(record=>
    record?.maturity==='PROVEN'&&record?.productionVerified===true&&safeProofLink(record.proofRef)
  );
  return {
    days:series,sourceRows,undated,
    observed:series.reduce((n,day)=>n+day.observed,0),
    failures:series.reduce((n,day)=>n+day.failures,0),
    learningSignals:series.reduce((n,day)=>n+day.learning,0),
    verifiedMemories:0,
    referencedMemories:referencedMemories.length,
    sampled:true,
    memoryRows:memories.slice(0,8).map(record=>({
      title:String(record?.naam||'Niet benoemd').slice(0,200),
      maturity:String(record?.maturity||'UNKNOWN')+(record?.maturity==='PROVEN'?' · bronclaim, niet onafhankelijk gecontroleerd':''),
      productionVerified:record?.productionVerified===true,
      proof:record?.maturity==='PROVEN'&&record?.productionVerified===true
        ? safeProofLink(record?.proofRef) : ''
    }))
  };
}
function chart(series,key,title){
  const max=Math.max(1,...series.map(row=>row[key]));
  const columns=series.map(row=>{
    const value=Number(row[key])||0;
    const height=value===0?0:Math.max(3,Math.round(value/max*100));
    const label=row.day.slice(5);
    return '<li><div class="pai-plot" title="'+html(row.day+': '+value)+
      '"><span style="height:'+height+'%"></span></div><small>'+html(label)+'</small></li>';
  }).join('');
  return '<section class="poc-panel pai-chart"><h4>'+html(title)+'</h4>'+
    '<p class="poc-note">Waarnemingen in de geladen selectie, per UTC-dag; geen volledig historisch meetarchief.</p>'+
    '<ol class="pai-bars" aria-label="'+html(title)+'">'+columns+'</ol></section>';
}
function metric(label,value,detail){
  return '<article class="poc-kpi"><small>'+html(label)+'</small><strong>'+
    html(value)+'</strong><span>'+html(detail)+'</span></article>';
}
function timeLabel(at){
  return at ? new Date(at).toLocaleString('nl-NL',{dateStyle:'short',timeStyle:'short'}) : 'Niet waargenomen';
}

/**
 * Evidence-first quality report: one read-only slice of the same tenant-bound
 * operating-loop response. No added metrics backend, score, scheduler or writer.
 * Event activity alone can never become a successful release, agent evaluation
 * or independently proven customer outcome.
 */
export function deriveQualityReport({events=[],runtime={},now=Date.now(),days=7}={}){
  const at=Number.isFinite(Number(now))?Number(now):Date.now();
  const length=Number.isInteger(days)?Math.min(30,Math.max(1,days)):7;
  const start=Date.parse(isoDay(at)+'T00:00:00Z')-(length-1)*86400000;
  const seen=new Set();
  const current=[];
  for(const e of items(events)){
    if(!e||typeof e!=='object')continue;
    const key=[e.id,e.occurredAt,e.title,e.status].map(String).join('|');
    if(seen.has(key))continue;
    seen.add(key);
    const t=validTime(e.occurredAt);
    if(t!==null&&t>=start&&t<=at+60000)current.push(e);
  }
  const failures=current.filter(isFailure);
  const ci=current.filter(e=>/github|codeql|ci\b|merge|deploy|release|workflow|pull.request/i.test(
    [e.layer,e.source,e.category,e.rawType].join(' ')));
  const traceEvents=current.filter(e=>typeof e.traceId==='string'&&e.traceId.trim());
  const learningEvents=current.filter(isLearning);
  const sourceEvents=current.filter(e=>sourceDefinitions.some(s=>s.pattern.test(
    [e.layer,e.source].join(' '))));
  const memories=items(runtime?.learning?.items);
  const declaredKnowledge=memories.filter(r=>
    r?.maturity==='PROVEN'&&r?.productionVerified===true&&safeProofLink(r?.proofRef));
  const verifiedIds=new Set();
  const declaredCustomerResults=items(runtime?.customerOutcomes?.items).filter(r=>{
    const id=String(r?.outcomeId||'').trim();
    if(!id||verifiedIds.has(id)||r?.tenantVerified!==true||
      r?.productionVerified!==true||r?.learningVerified!==true||
      !safeProofLink(r?.proofRef)||!safeProofLink(r?.learningProofRef)||
      !['VERIFIED','REALIZED_VERIFIED'].includes(String(r?.verificationStatus||'')))return false;
    verifiedIds.add(id);
    return true;
  });
  const label=(id,title,status,detail,count)=>Object.freeze({id,title,status,detail,count});
  return Object.freeze({
    windowDays:length,observedEvents:current.length,failures:failures.length,
    // The quality report has no signed provider readback or provider-backed
    // reconciliation channel. Never infer independent verification from fields
    // supplied inside this client-side runtime object, even if they claim so.
    provenKnowledge:0,verifiedCustomerOutcomes:0,
    declaredKnowledgeReferences:declaredKnowledge.length,
    declaredOutcomeReferences:declaredCustomerResults.length,
    rows:Object.freeze([
      label('delivery','CI/CD & productie',
        ci.some(isFailure)?'AANDACHT':ci.length?'WAARGENOMEN':'ONBEKEND',
        ci.length?ci.length+' delivery-signalen; '+ci.filter(isFailure).length+
          ' foutsignalen. Geen DORA-waarde of exacte productie-SHA zonder onafhankelijk deploybewijs.'
          :'Geen herleidbare CI/CD-waarnemingen in de geladen selectie.',ci.length),
      label('incidents','Incidenten & herstel',
        failures.length?'AANDACHT':current.length?'GEEN FOUT IN SELECTIE':'ONBEKEND',
        failures.length?failures.length+' geregistreerde fout-/blokkadesignalen; oorzaken en herstel apart verifiëren.'
          :'Afwezigheid in deze selectie is geen bewijs van storingsvrijheid.',failures.length),
      label('agents','Agents & tracekwaliteit',
        traceEvents.length?'TRACE WAARGENOMEN':'NIET GEMETEN',
        traceEvents.length?traceEvents.length+' events met trace-ID; geen onafhankelijke trace-grade of regressiebewijs.'
          :'Geen verifieerbare trace-ID in deze geladen selectie; modelkwaliteit onbekend.',traceEvents.length),
      label('learning','Kennis & leerverbetering',
        declaredKnowledge.length?'BRONCLAIM':learningEvents.length?'LEREN WAARGENOMEN':'NIET BEWEZEN',
        declaredKnowledge.length?declaredKnowledge.length+' productiekennisclaims met verwijzingen; inhoud en productie-effect zijn niet onafhankelijk gecontroleerd.'
          :learningEvents.length+' leer-/skill-signalen, zonder bewezen productieverbetering.',declaredKnowledge.length),
      label('sources','Bronnen & versheid',
        sourceEvents.length?'HERKOMST WAARGENOMEN':'NIET GEMETEN',
        sourceEvents.length?sourceEvents.length+' herleidbare bron-events; leveranciers-SLA, synchronisatie en volledigheid niet vastgesteld.'
          :'Geen bron-events beschikbaar; bronkoppelingen niet beoordeeld.',sourceEvents.length),
      label('outcomes','Klantwaarde & resultaat',
        declaredCustomerResults.length?'BRONCLAIM':'NIET BEWEZEN',
        declaredCustomerResults.length?declaredCustomerResults.length+' unieke aangeleverde klantresultaatclaims met verwijzingen; geen onafhankelijke providerreconciliatie, tenant- of effectverificatie aangetoond.'
          :'Geen onafhankelijk gecontroleerde klantuitkomst in deze projectie.',declaredCustomerResults.length),
      label('policy','Privacy & autorisatie','APART TOETSEN',
        'Geen tenant-, regio- of toestemmingsclaim op basis van eventtelling; bevoegdheden blijven serverzijdig.',null)
    ])
  });
}

export function qualityReportMarkup({events=[],runtime={},days=7,now=Date.now()}={}){
  const report=deriveQualityReport({events,runtime,days,now});
  const rows=report.rows.map(r=>
    '<tr><th scope="row">'+html(r.title)+'</th><td><span class="pai-quality-state">'+
    html(r.status)+'</span></td><td>'+html(r.detail)+'</td></tr>').join('');
  const actions=[];
  if(report.failures)actions.push('Onderzoek actuele foutclusters bij dezelfde canonieke incidenteigenaar.');
  if(!report.provenKnowledge)actions.push('Koppel leerclaims aan regresstest, productiecontrole en bronbewijs.');
  if(!report.verifiedCustomerOutcomes)actions.push('Verbind uitgevoerde acties met unieke, tenantgebonden resultaten en onafhankelijk leerbewijs.');
  actions.push('Meet DORA-doorlooptijd, change failure rate en trace-grades uitsluitend uit volledige CI- en runtimebronnen.');
  return '<section class="poc-panel pai-quality-report" aria-labelledby="pai-quality-title">'+
    '<header><span class="pai-quality-eyebrow">KWALITEITSRAPPORT · BEWIJSGESTUURD</span>'+
    '<h4 id="pai-quality-title">Hoe betrouwbaar verbeteren we echt?</h4>'+
    '<p class="poc-note">Automatische momentopname van de reeds beveiligde Brain/Heartbeat-readback; venster: '+
    html(report.windowDays)+' UTC-dagen. Geen fictief totaalcijfer, geen beloofde omzet, geen schijn-groen.</p></header>'+
    '<div class="poc-tablewrap"><table class="poc-table pai-quality-table"><thead><tr><th scope="col">Kwaliteitsgebied</th>'+
    '<th scope="col">Bewijsstatus</th><th scope="col">Onderbouwing en beperking</th></tr></thead>'+
    '<tbody>'+rows+'</tbody></table></div>'+
    '<div class="pai-quality-actions"><b>Volgende verbeteracties op basis van bewijs</b><ol>'+
    actions.map(a=>'<li>'+html(a)+'</li>').join('')+'</ol></div>'+
    '<p class="poc-note">Controleer iedere status met bron, tijdstempel, eigenaar, exacte release en vervolgmeting. '+ 
    'Een CI-run, sociale interactie, agenttrace of leernotitie is op zichzelf geen gerealiseerde klantwaarde. '+
    'Een aangeleverde GitHub-/Netlify-/Supabase-link bewijst de inhoud niet. Onafhankelijke verificatie vereist een serverzijdig gekoppeld providerbewijs. '+
    'Onvolledige of gefilterde geschiedenis mag geen 100%-score produceren.</p></section>';
}

export function agentIntelligenceMarkup({events=[],runtime={},period='week',now=Date.now()}={}){
  const days=period==='today'?1:period==='month'?30:period==='all'?30:7;
  const telemetry=deriveLearningTelemetry({events,runtime,days,now});
  const sources=telemetry.sourceRows.map(row=>'<article class="pai-source"><div><b>'+
    html(row.label)+'</b><small>'+
    (row.observations ? html('Laatste waarneming: '+timeLabel(row.latest)) :
      'Geen bronbewijs in geladen selectie')+'</small></div><strong>'+
    (row.observations?html(row.observations):'—')+'</strong></article>').join('');
  const memories=telemetry.memoryRows.map(record=>'<article class="pai-memory"><b>'+
    html(record.title)+'</b><small>'+html(record.maturity)+
    (record.proof?' · Bronreferentie aanwezig, inhoud niet onafhankelijk bevestigd':' · Niet onafhankelijk als productieverbetering aangetoond')+
    '</small>'+(record.proof?'<a href="'+html(record.proof)+'" target="_blank" rel="noopener noreferrer">Bronbewijs</a>':'')+
    '</article>').join('');
  return '<section class="pai-learning" aria-labelledby="pai-title">'+
    '<header class="pai-head"><div><span>POWERHOUSE · LEERINTELLIGENTIE</span>'+
    '<h3 id="pai-title">Worden de agents aantoonbaar slimmer?</h3>'+
    '<p>Van signalen en incidenten naar besluiten, tests, productiecontrole en herbruikbare kennis. '+
    'Dezelfde bestaande Brain/Heartbeat-loop blijft eigenaar van acties; deze cockpit is uitsluitend read-only.</p></div></header>'+
    '<div class="poc-kpis pai-kpis">'+
      metric('Activiteit waargenomen',telemetry.observed,'Geen bewijs van behaalde bedrijfswaarde')+
      metric('Fout- en blokkadesignalen',telemetry.failures,'Geclassificeerde runtime-events')+
      metric('Leer- en skill-events',telemetry.learningSignals,'Niet automatisch toegepast')+
      metric('Kennis met bronreferentie',telemetry.referencedMemories,'Aangeleverde bronclaims; nog niet onafhankelijk gecontroleerd')+
    '</div>'+
    '<div class="poc-grid2">'+chart(telemetry.days,'observed','Activiteit per dag')+
      chart(telemetry.days,'failures','Foutsignalen per dag')+'</div>'+
    '<div class="poc-grid2">'+
      '<section class="poc-panel"><h4>Bronnenmatrix</h4><p class="poc-note">GitHub, Supabase, Notion en Netlify worden alleen als waargenomen aangeduid wanneer de beveiligde Brain-projectie daar herleidbare events voor toont. Afwezig betekent niet dat een koppeling defect is.</p>'+
      '<div class="pai-source-list">'+sources+'</div></section>'+
      '<section class="poc-panel"><h4>Verifieerbaar leren</h4><p class="poc-note">Een notitie, hypothese of groene CI-check is geen gerealiseerde klantverbetering. Alleen door de bestaande server als PROVEN gemarkeerde kennis met productiereadback én geldig bewijs krijgt die kwalificatie.</p>'+
      (memories||'<div class="poc-empty">Nog geen kennisrecords in deze beveiligde readback.</div>')+'</section>'+
    '</div>'+
    qualityReportMarkup({events,runtime,days,now})+
    '<section class="poc-panel"><h4>Zelfverbeterende besluitlus</h4>'+
      '<div class="pai-flow" role="list">'+
      ['Signaal','Oorzaak','Hypothese','Test','Guardrails','Productiereadback','Leerregel & skill'].map((step,index)=>
       '<span role="listitem"><small>'+String(index+1).padStart(2,'0')+'</small>'+html(step)+'</span>').join('')+
      '</div><p class="poc-note">De bestaande agents delen bronverwijzingen, fingerprint, besluit, regresstest en resultaat via de canonieke registraties. Lage-risicoacties kunnen na toegestane controles autonoom worden uitgevoerd; klantgegevens, betalingen, rechten en productiepromotie houden hun verplichte menselijke of technische autorisatie.</p></section>'+
    '<p class="poc-note">Datakwaliteit: momentopname uit de bestaande operating-loopprojectie. De grafieken bevatten maximaal 30 UTC-dagen aan geladen events; ontbrekende historie en niet-bewezen resultaten worden niet aangevuld. '+
    html(telemetry.undated)+' events zonder bruikbaar tijdstempel niet in de grafieken. Geen tweede scheduler of foutregister.</p>'+
    '</section>';
}
