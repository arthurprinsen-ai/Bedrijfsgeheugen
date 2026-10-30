import { ensureIdentityWidget } from '../portal-state.js';

// Owner-only client for the existing canonical website/CRO authorities.
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=(value,fallback='—')=>value===null||value===undefined?fallback:new Intl.NumberFormat('nl-NL',{maximumFractionDigits:1}).format(value);
const date=value=>{if(!value)return '—';const t=Date.parse(value);return Number.isFinite(t)?new Intl.DateTimeFormat('nl-NL',{dateStyle:'short'}).format(new Date(t)):'—';};
const moment=value=>{if(!value)return '—';const t=Date.parse(value);return Number.isFinite(t)?new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(t)):'—';};
const money=value=>value===null||value===undefined?'—':new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value);
const css='.cro-od{font:inherit;color:#18233e}.cro-od h3{margin:.15rem 0 .65rem}.cro-od p{line-height:1.5}.cro-od .od-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.75rem;margin:1rem 0}.cro-od .od-card{border:1px solid #dae3f1;background:#fff;padding:1rem;border-radius:13px}.cro-od .od-card small{display:block;color:#536278}.cro-od .od-card strong{font-size:1.6rem;display:block;margin:.35rem 0}.cro-od .od-note{background:#edf3ff;padding:.85rem 1rem;border-radius:10px}.cro-od .od-warn{border-left:4px solid #bd7114;background:#fff7e6;padding:.8rem;margin:.75rem 0}.cro-od .od-controls{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.cro-od input,.cro-od select{font:inherit;border:1px solid #b6c7df;border-radius:8px;padding:.6rem;max-width:100%;background:white;color:#18233e}.cro-od table{width:100%;border-collapse:collapse;font-size:.9rem}.cro-od th,.cro-od td{text-align:left;border-bottom:1px solid #dce5ef;vertical-align:top;padding:.65rem .45rem}.cro-od th{white-space:nowrap}.cro-od .od-scroll{overflow-x:auto}.cro-od details{max-width:440px}.cro-od summary{cursor:pointer}.cro-od code{white-space:pre-wrap;overflow-wrap:anywhere}.cro-od .od-actions{display:flex;gap:.5rem;flex-wrap:wrap}.cro-od button{cursor:pointer;border:1px solid #8eaad0;border-radius:8px;padding:.55rem .8rem;color:#153f7a;background:#eef5ff}.cro-od .od-status{font-size:.8rem;font-weight:700}.cro-od .od-foot{font-size:.85rem;color:#56657c}';
function badge(value){
  const v=String(value||'UNKNOWN');
  return '<span class="od-status">'+esc(v.replace(/_/g,' '))+'</span>';
}
function field(label,val){return '<article class="od-card"><small>'+esc(label)+'</small><strong>'+esc(val)+'</strong></article>';}
function rawDetails(label,data){
  if(data===undefined||data===null)return '';
  const formatted=JSON.stringify(data,null,2).slice(0,1800);
  return '<details><summary>'+esc(label)+'</summary><code>'+esc(formatted)+'</code></details>';
}
function experimentRows(rows){
  return rows.map(r=>'<tr>'+
    '<td><strong>'+esc(r.id||'—')+'</strong><br><small>'+esc(r.pagina||r.onderdeel||'Pagina onbekend')+'</small></td>'+
    '<td>'+esc(r.hypothesis||'Geen hypothese vastgelegd')+'<br><small>Controle: '+esc(r.controle||'—')+' · Variant: '+esc(r.variant||'—')+'</small>'+
    rawDetails('Basislijn',r.baseline)+rawDetails('Resultaat',r.result)+'</td>'+
    '<td>'+badge(r.status)+'<br><small>Vanaf '+esc(date(r.start))+'</small></td>'+
    '<td>'+esc(r.metric||'—')+'<br><small>Treatment '+esc(fmt(r.treatment))+' / holdout '+esc(fmt(r.holdout))+' · minimaal '+esc(fmt(r.minSample))+'</small></td>'+
    '<td>'+badge(r.causalStatus||'NIET BEOORDEELD')+'<br><small>'+esc(r.readinessReason||'')+'</small></td>'+
    '<td>'+esc(r.advice||r.decision||'Nog geen gecontroleerd besluit')+'<br><small>Omzetbewijs: '+esc(money(r.realizedRevenue))+'</small></td>'+
    '</tr>').join('');
}
function render(container,data){
  const source=data?.sources||{};
  const website=data?.website;
  const weekly=data?.websiteWeeklyGrowth||null;
  const social=data?.socialFunnel||null;
  const growth=data?.growthDirection||null;
  const improvement=data?.compoundImprovement||null;
  const acquisition=data?.acquisitionCta||null;
  const channelNames={linkedin_personal:'LinkedIn persoonlijk',linkedin_company:'LinkedIn bedrijf',instagram:'Instagram'};
  const socialRows=(social?.channels||[]).map(row=>{
    const metric=key=>{
      const m=row?.metrics?.[key];
      if(!m||m.direction==='INSUFFICIENT_COMPARABLE_SAMPLE')return 'Onvoldoende vergelijkbare bronmetingen';
      const delta=m.relative_change_pct===null?'Niet berekenbaar':fmt(m.relative_change_pct)+'%';
      return esc(m.direction)+' ('+esc(delta)+')';
    };
    return '<tr><td><strong>'+esc(channelNames[row.channel]||row.channel)+'</strong></td>'+
      '<td>'+esc(fmt(row.posts_registered))+'</td>'+
      '<td>'+esc(fmt(row.recent_aligned_snapshots))+' / '+esc(fmt(row.baseline_aligned_snapshots))+'</td>'+
      '<td>'+metric('views')+'</td><td>'+metric('likes')+'</td><td>'+metric('comments')+'</td>'+
      '<td>'+metric('shares')+'</td><td>'+metric('clicks')+'</td></tr>';
  }).join('');
  const experiments=Array.isArray(data?.experiments)?data.experiments:null;
  const behavior=data?.behavior||null;
  const flags=Array.isArray(data?.quality?.flags)?data.quality.flags:[];
  const proof=data?.conversionProof||null;
  const coverage=data?.croMeasurement||null;
  const recency=data?.croEventRecency||null;
  const cohorts=Array.isArray(data?.experimentProof)?data.experimentProof:null;
  const brain=data?.brainClosure||null;
  const oneLoop=data?.oneLoop||null;
  const outreach=data?.outreachRecovery||null;
  const loopRows=oneLoop?.status==='READBACK_COMPLETE'&&Array.isArray(oneLoop.loops)
    ?oneLoop.loops.filter(row=>row.status!=='GREEN').slice(0,15).map(row=>
      '<tr><td>'+esc(row.key)+'</td><td>'+badge(row.status)+'</td><td>'+
      esc(row.guard)+'</td><td>'+
      esc((row.missingStages||[]).join(', ')||row.problem||'Afhandeling of onafhankelijk bewijs nodig')+'</td></tr>').join('')
    :'';
  const loopCounts=oneLoop?.status==='READBACK_COMPLETE'?oneLoop.counts:null;

  const gateNames={
    BRAIN_DELIVERY_READBACK:'Growth-event afgeleverd aan ONE BRAIN (niet alleen Heartbeat-opslag)',
    FIRST_PARTY_EVENT_RECEIPT:'Exacte opslagbevestiging website-event',
    ACTUAL_CTA_EXPOSURE:'Echte CTA-interactie',
    CONTROLLED_CRO_EXPERIMENT:'Gerandomiseerde controlegroep met volwassen uitkomst',
    QUALIFIED_BUYER_READBACK:'Gekwalificeerde lead onafhankelijk bevestigd',
    PAID_ORDER_READBACK:'Betaling onafhankelijk bevestigd',
    ONE_BRAIN_LEARNING_APPLIED:'Leerregel toegepast in volgende natuurlijke run'
  };
  const brainRows=Array.isArray(brain?.gates)?brain.gates.map(g=>
    '<tr><td>'+esc(gateNames[g.gate]||g.gate)+'</td><td>'+badge(g.verified?'BRONBEWIJS AANWEZIG':'BEWIJS ONTBREEKT')+'</td></tr>').join(''):'';

  const proofCards=proof?[
    field('Pagina-events zonder botvlag (7 dagen; geen unieke mensen)',fmt(proof.humanFlaggedPageviews7d)),
    field('Formulierverzendintenties (7 dagen; geen lead)',fmt(proof.formSubmitIntents7d)),
    field('Opgeslagen CTA-events (7 dagen)',fmt(proof.observedCtaEvents7d)),
    field('CTA-events in dagaggregatie (7 dagen)',fmt(proof.dailyCtaAggregated7d)),
    field('Geregistreerde contactleads (30 dagen)',fmt(proof.recordedLeads30d)),
    field('Gekoppelde kwalificatierecords (30 dagen)',fmt(proof.linkedQualifiedLeadRecords30d)),
    field('Orders met vastgelegde providerreferenties',fmt(proof.ordersWithRecordedProviderReadback30d)),
    field('Onafhankelijk bevestigde betaalde orders',fmt(proof.paidOrdersIndependentlyVerified)),
    field('Onafhankelijk bevestigde gerealiseerde omzet',money(proof.realizedRevenueIndependentlyVerifiedEur))
  ].join(''):field('Onafhankelijke commerciële bewijsbron','Niet beschikbaar');
  const cohortRows=cohorts?cohorts.map(r=>'<tr><td>'+esc(r.key)+'</td><td>'+badge(r.status)+'</td><td>'+esc(fmt(r.maturedTreatment))+' / '+esc(fmt(r.maturedHoldout))+'</td><td>'+esc(fmt(r.minimumPerArm))+'</td></tr>').join(''):'';
  const sectionRows=(behavior?.exitSections||[]).slice(0,20).map(r=>
    '<tr><td><code>'+esc(r.pad)+'</code></td><td>'+esc(r.section)+'</td><td>'+esc(fmt(r.observedExits))+'</td><td>'+esc(fmt(r.earlyExitSignals))+'</td></tr>').join('');
  const behaviorCards=behavior?[
    field('Menselijke events: paginaweergaven met toestemming',fmt(behavior.events.page_events)),
    field('Betrouwbaar opgeslagen event-ID’s (geen unieke bezoekers)',fmt(behavior.events.persisted_event_receipts)),
    field('Historische events zonder bevestigde event-ID',fmt(behavior.events.historical_without_receipt)),
    field('Waargenomen vertrekgebeurtenissen (geen volledig exit-totaal)',fmt(behavior.events.observed_exits)),
    field('Laatste scroll onder 25% bij waargenomen vertrek',fmt(behavior.events.observed_exits_under_25)),
    field('Formulieren verlaten (waargenomen)',fmt(behavior.events.form_abandons)),
    field('Formulierfouten',fmt(behavior.events.form_errors)),
    field('WhatsApp-intentieklikken',fmt(behavior.events.whatsapp_clicks)),
    field('Snelle herhaalde klikken (heuristiek)',fmt(behavior.events.rapid_click_heuristics)),
    field('Waargenomen experimentblootstellingen',fmt(behavior.events.experiment_exposures))
  ].join(''):field('Gedragsbron','Nog niet verifieerbaar');
  const cardData=website
    ? field('Geregistreerde paginabezoeken (30 dagen)',fmt(website.pageViews))+
      field('Geregistreerde CTA-klikken (30 dagen)',fmt(website.ctaClicks))+
      field('In dagtotalen gemelde gekwalificeerde leads',fmt(website.qualifiedLeads))+
      field('In dagtotalen gemelde orders (onbevestigd)',fmt(website.wonOrders))+
      field('Toegerekende omzet (nog te verifiëren)',money(website.revenueEur))
    :field('Website-meetgegevens','Bron niet beschikbaar');
  const weeklyLabels={page_views:'Paginaweergaven (niet unieke bezoekers)',
    cta_clicks:'CTA-klikken',qualified_leads:'Geregistreerde leads (onbevestigd)',
    won_orders:'Geregistreerde orders (niet betaald geverifieerd)'};
  const weeklyRows=weekly?.metrics?Object.entries(weeklyLabels).map(([key,label])=>{
    const m=weekly.metrics[key];
    const change=m.changePct===null?'Geen % bij nulbasislijn':fmt(m.changePct)+'%';
    return '<tr><td>'+esc(label)+'</td><td>'+esc(fmt(m.previous))+'</td><td>'+
      esc(fmt(m.current))+'</td><td>'+badge(m.direction)+' · '+esc(change)+'</td></tr>';
  }).join(''):'';
  const weeklyCard='<section class="od-card"><h3>Websitegroei · twee volledig afgesloten weken</h3>'+
    '<p>Meet het verschil tussen twee opeenvolgende perioden van zeven volledige kalenderdagen (Europe/Amsterdam). Alleen oorspronkelijke daggegevens; geen berekende unieke bezoekers en geen fictieve orders of omzet.</p>'+
    '<p>Bronbewijs: '+badge(weekly?.status||'UNVERIFIED')+' · vorige week '+
      esc(weekly?.baseline?.from||'—')+' t/m '+esc(weekly?.baseline?.through||'—')+
      ' · recente week '+esc(weekly?.recent?.from||'—')+' t/m '+esc(weekly?.recent?.through||'—')+'</p>'+
    (weeklyRows?'<div class="od-scroll"><table><thead><tr><th>Meetpunt</th><th>Vorige 7 dagen</th><th>Recente 7 dagen</th><th>Richting / verandering</th></tr></thead><tbody>'+weeklyRows+'</tbody></table></div>':
      '<p class="od-warn">Vergelijking niet verantwoord: '+esc(weekly?.reason||'Bronbewijs ontbreekt')+
      '. Ontbrekende kalenderdagen: '+esc((weekly?.missingDays||[]).join(', ')||'niet vastgesteld')+'.</p>')+
    '<p class="od-foot">CTA-percentage van paginaweergaven: vorige week '+esc(fmt(weekly?.ctaRate?.previous))+
    '% · recente week '+esc(fmt(weekly?.ctaRate?.current))+
    '%. Dit is géén bezoekers-naar-betaalde-orders-conversie. De werkelijke betaalde-orderfunnel vereist onafhankelijke betalings- en attributiebewijzen.</p></section>';

  const loops=(improvement?.loops||[]);
  const compoundCards=loops.map(loop=>'<article class="od-card">'+
    '<h4>'+esc(({'commercial-to-next-action':'Orders → volgende betere actie',
      'customer-portal-to-better-product':'Klantgebruik → slimmer portaal',
      'incident-to-prevented-repeat':'Fout → bewezen preventie'})[loop.key]||loop.key)+'</h4>'+
    '<p>Status: '+badge(loop.status)+'</p>'+
    '<p class="od-foot">Bestaande eigenaar: '+esc(loop.owner)+
    '. Volgend onafhankelijk bewijs: '+esc(loop.nextProof)+'</p>'+
    '<div class="od-scroll"><table><tbody>'+Object.entries(loop.observed||{}).map(([key,val])=>
      '<tr><th>'+esc(key.replace(/([A-Z])/g,' $1'))+'</th><td>'+esc(typeof val==='boolean'?
        (val?'Bewezen':'Niet bewezen'):fmt(val))+'</td></tr>').join('')+'</tbody></table></div></article>').join('');
  const improvementPriorities=(improvement?.priorities||[]).map(item=>
    '<tr><td>'+esc(item.priority)+'</td><td><strong>'+esc(item.key)+'</strong>'+
    '<br><small>'+esc(item.basis)+'</small></td><td>'+esc(item.owner)+'</td>'+
    '<td>'+badge(item.status)+'<br><small>'+esc(item.next)+'</small></td></tr>').join('');
  const innovation=improvement?.innovationPortfolio||null;
  const innovationRows=(innovation?.innovationCandidates||[]).map(item=>
    '<tr><td><strong>'+esc(item.id)+'</strong><br><small>'+esc(item.domain)+'</small></td>'+
    '<td>'+badge(item.stage)+'<br><small>'+esc(item.reason)+'</small></td>'+
    '<td>'+esc(item.owner)+'</td>'+
    '<td>'+esc(item.implementationBrief)+'<br><small>Technieken: '+esc((item.technologyOptions||[]).join(' · '))+
    '<br>Meetdoel: '+esc(item.primaryOutcome)+'</small></td></tr>').join('');
  const innovationCard='<section class="od-card" data-powerhouse-autonomous-innovation>'+
    '<h3>Autonomous Innovation Lab · agents bedenken en ontwikkelen zelfstandig</h3>'+
    '<p>De bestaande Growth, Customer Success, AI/ONE BRAIN en Engineering-agents gebruiken deze voortdurend opnieuw berekende verbeteragenda. Zij kunnen binnen hun bestaande bevoegdheden veilige, omkeerbare kandidaten ontwikkelen, testen en via Required, CodeQL en een beschermde release uitrollen. Dit overzicht is een plan, géén bewezen ontwikkelactie, live AI-model of omzetstijging.</p>'+
    '<p>Innovatieprojectie: '+badge(innovation?.status||'UNVERIFIED')+
    ' · Broncontrole: '+esc(innovation?.observedAt||'—')+'</p>'+
    '<div class="od-scroll"><table><thead><tr><th>Innovatie</th><th>Bewijs en fase</th><th>Eigenaar</th><th>Technologie, verandering en meetdoel</th></tr></thead>'+
    '<tbody>'+(innovationRows||'<tr><td colspan="4">Eerst originele Brain-, CRO- en klantbronnen controleren; geen fictieve AI-ideeën als actie afvinken.</td></tr>')+
    '</tbody></table></div>'+
    '<p class="od-foot">Automatische technologiekeuze vereist een echte champion/challenger-evaluatie op kwaliteit, veiligheid, privacy, kosten en snelheid. Alle klanteninzichten blijven per tenant afgeschermd. Live pas na exacte releasebewijs; slimmer alleen na onafhankelijk geverifieerde klantwaarde of verkoopuitkomst.</p></section>';

  const compoundCard='<section class="od-card" data-one-brain-compound-proof>'+
    '<h3>ONE BRAIN + Heartbeat · drie dagelijkse verbeterlussen</h3>'+
    '<p>Gedeelde originele commerciële, leer-, runtime- en portaalbronnen. De agents hebben één gezamenlijke bewijslijst; alleen geregistreerde acties, werkelijke klantwaarde en onafhankelijke betaalbewijzen kunnen een resultaat sluiten. Een groen technisch systeem is niet automatisch meer omzet.</p>'+
    '<p>Bewijsstatus: '+badge(improvement?.status||'UNVERIFIED')+
    ' · Laatste controle '+esc(improvement?.at||'—')+'</p>'+
    '<div class="od-grid">'+(compoundCards||field('Bestaande verbeterlussen','Bronbewijs niet beschikbaar'))+'</div>'+
    '<h4>Geprioriteerde opdrachten voor bestaande agents (nog geen uitvoering)</h4>'+
    '<div class="od-scroll"><table><thead><tr><th>#</th><th>Bewijsachterstand</th><th>Oorspronkelijke eigenaar</th><th>Veilige volgende stap</th></tr></thead>'+
    '<tbody>'+(improvementPriorities||'<tr><td colspan="4">Geen actuele, verifieerbare prioritering beschikbaar.</td></tr>')+
    '</tbody></table></div>'+
    '<p class="od-foot">Portaalroute-events bevatten mogelijk beheerders en previews: dit zijn geen geverifieerde betalende klanten of unieke bezoekers. De kaart toont geen persoonsgegevens, verzendt niets en kan de oorspronkelijke vijftien Heartbeat-lussen niet groen maken. Ontbrekende, verouderde of niet-toegestane bronnen blijven UNVERIFIED.</p></section>';

  container.innerHTML='<section class="cro-od" aria-labelledby="croOtherDataTitle">'+
    '<style>'+css+'</style>'+
    '<div class="od-actions"><button type="button" data-cro-reload>Bronnen vernieuwen</button><a href="https://www.bedrijfsgeheugen.nl/portal-v2/?page=powerhouse-control-center" data-open-page="powerhouse-control-center">Powerhouse Control Center</a></div>'+
    '<h3 id="croOtherDataTitle">Websitegegevens & CRO-experimenten</h3>'+
    '<p class="od-note">Eén beveiligde, alleen-lezen projectie van de bestaande Powerhouse- en Supabase-bronnen. Websitegedrag, experimenten, hypotheses, steekproeven, resultaten en besluiten blijven van elkaar onderscheiden. Geen verzonnen uplift of conversie.</p>'+
    '<p class="od-foot">Bronstatus website: '+badge(source.website?.status)+' · experimenten: '+badge(source.experiments?.status)+' · beleid: '+badge(source.policies?.status)+' · conversiebewijs: '+badge(source.conversionProof?.status)+' · cohortbewijs: '+badge(source.experimentProof?.status)+' · uitstap- en gedragssignalen: '+badge(source.behavior?.status)+' · Social CRO: '+badge(source.socialFunnel?.status)+' · laatste website-update '+esc(date(source.website?.lastObservedAt))+' · laatst gecontroleerd '+esc(date(data.generatedAt))+'</p>'+
    '<div class="od-grid">'+cardData+'</div>'+
    weeklyCard+
    compoundCard+
    innovationCard+
    '<section class="od-card"><h3>Powerhouse · één canonieke lus (15 controleketens)</h3>'+
    '<p>Deze read-only status komt rechtstreeks uit dezelfde bestaande ONE BRAIN/Heartbeat-controlebron als het Powerhouse Control Center. CRO en omzet gebruiken deze gedeelde waarheid; een RED betekent geen afgeronde commerciële cyclus.</p>'+
    '<p>Oorspronkelijke 15-lussenbron: '+badge(source.oneLoop?.status)+
    ' · Organisme: '+badge(oneLoop?.overallStatus)+
    ' · Laatste controle: '+esc(date(oneLoop?.checkedAt))+'</p>'+
    '<div class="od-grid">'+field('Groen',fmt(loopCounts?.green))+
    field('Oranje',fmt(loopCounts?.amber))+field('Rood',fmt(loopCounts?.red))+'</div>'+
    (loopRows?'<div class="od-scroll"><table><thead><tr><th>Lus</th><th>Status</th><th>Broncontrole</th><th>Open bewijs</th></tr></thead><tbody>'+
    loopRows+'</tbody></table></div>':
    '<p>Geen onbewezen groene status: '+esc(oneLoop?.reason||'Geen rode of oranje lussen waargenomen')+'.</p>')+
    '<p class="od-foot">Een ontbrekende of verouderde 15-lussenreadback blijft UNVERIFIED. Nooit kunstmatig groen maken; resultaten pas sluiten met onafhankelijk uitvoerings-, conversie- en providerbewijs.</p></section>'+
    '<section class="od-card"><h3>Autonome outreach · brononderzoek → uitvoering → ontvangstbewijs</h3>'+
    '<p>Gedeelde Powerhouse/ONE BRAIN-waarheid uit de oorspronkelijke sales-actions. Een intern onderzoek is geen verzonden e-mail; een cronstatus is geen Gmail-bewijs.</p>'+
    '<p>Bronreadback: '+badge(outreach?.status)+' · Verantwoordelijke onderzoeksagent: '+
    esc(outreach?.nextOwner||'Niet bevestigd')+'</p>'+
    '<div class="od-grid">'+field('E-mails geblokkeerd op bronbewijs',fmt(outreach?.sourceResearchHeld))+
    field('Open interne onderzoeksacties',fmt(outreach?.internalResearchPending))+
    field('Afgeronde onderzoeksacties (geen verzendbewijs)',fmt(outreach?.internalResearchDone))+
    field('Onderzoek: geen actueel signaal gevonden',fmt(outreach?.researchNoCurrentSignal))+
    field('Niet-onafhankelijk geverifieerde bronkandidaten',fmt(outreach?.researchSourceCandidatesUnverified))+
    field('Eerstvolgende reguliere onderzoekscontrole',esc(date(outreach?.nextOriginalResearchAt)))+
    field('Verzendingen met vastgelegde Gmail-readback',fmt(outreach?.providerVerifiedSends))+'</div>'+
    '<p class="od-foot">Een SERP-resultaat of interne bronkandidaat is géén geverifieerd actueel bedrijfssignaal. Zonder onafhankelijk bron- en kwaliteitsbewijs blijft de e-mail tegen verzending beschermd.</p>'+ 
    '<p class="od-foot">Ontbrekende actuele bedrijfsspecifieke bron → bestaande interne onderzoeksactie (dedupe) → originele tekstkwaliteitscontrole → geautoriseerde e-mail → onafhankelijke Gmail SENT-label/ontvanger-readback → Heartbeat action/readback. Bij ontbrekend bewijs blijft de lus AMBER en wordt er niets verzonnen. '+esc(outreach?.reason||'')+'</p></section>'+
    '<section class="od-card"><h3>ONE BRAIN · commerciële CRO-terugkoppeling</h3>'+
    '<p>Originele Heartbeat → canonieke Brain-opslag, zonder tweede scheduler of losse registratie. Een technische readback bewijst nog geen verkoop of experimentele verbetering.</p>'+
    '<p>Commerciële lus: '+badge(data.commercialLoopStatus||'NOT_VERIFIED')+
    ' · Brain-bron: '+badge(source.brainProof?.status)+
    ' · Laatst waargenomen: '+esc(date(brain?.lastObservedAt))+
    ' · Technische readback: '+badge(brain?.technicalReadbackVerified?'BEVESTIGD':'NIET BEVESTIGD')+'</p>'+
    '<div class="od-grid">'+field('Onafhankelijk bevestigde omzet',money(brain?.verifiedPaidRevenueEur))+
    field('Volwassen treatment',fmt(brain?.observed?.maturedTreatment))+
    field('Volwassen controlegroep',fmt(brain?.observed?.maturedHoldout))+'</div>'+
    '<div class="od-scroll"><table><thead><tr><th>Verificatiestap</th><th>Bewijsstatus</th></tr></thead><tbody>'+
    (brainRows||'<tr><td colspan="2">Nog geen onafhankelijk teruggelezen natuurlijke Heartbeat-run.</td></tr>')+
    '</tbody></table></div>'+
    '<p class="od-foot">Dit overzicht leest alleen het bestaande ONE BRAIN-registratiepad. Ontbrekende leads, orders en betalingen worden nooit groen gezet.</p></section>'+
    '<section class="od-card"><h3>Powerhouse · stijgende lijn van bereik naar betaalde orders</h3>'+
    '<p>Één ONE BRAIN/CRO-scorecard: zeven volledig afgesloten UTC-dagen versus de zeven daarvoor. Website-sessies zijn bronheuristieken; social vergelijkt uitsluitend leeftijdsgelijke providerdata. Het doel is groei, niet een garantie of kunstmatig groen.</p>'+
    '<p>Brontoestand: '+badge(growth?.status||'UNVERIFIED')+' · Venster: '+esc(growth?.period||'Niet beschikbaar')+
    ' · GA4: '+badge(growth?.providers?.ga4?.state||'UNAVAILABLE')+
    ' · Search Console: '+badge(growth?.providers?.search_console?.state||'UNAVAILABLE')+'</p>'+
    '<div class="od-grid">'+
      field('Website-sessies (niet-bot-heuristiek) 7d vs 7d',growth?.website?.metrics?.human_sessions?.direction==='INSUFFICIENT_COMPARABLE_DATA'?'Onvoldoende betrouwbare dagen':esc(growth?.website?.metrics?.human_sessions?.direction||'Onbekend')+' · '+fmt(growth?.website?.metrics?.human_sessions?.relative_change_pct)+'%')+
      field('Menselijke websitekliks 7d vs 7d',growth?.website?.metrics?.human_clicks?.direction==='INSUFFICIENT_COMPARABLE_DATA'?'Onvoldoende betrouwbare dagen':esc(growth?.website?.metrics?.human_clicks?.direction||'Onbekend')+' · '+fmt(growth?.website?.metrics?.human_clicks?.relative_change_pct)+'%')+
      field('Geregistreerde e-mailantwoorden, 14d',fmt(growth?.email?.recordedEvents14d))+
      field('Onafhankelijk bewezen betaalde orders',fmt(growth?.qualifiedOrders?.paidOrders))+
      field('Orders vanuit e-mail',fmt(growth?.email?.ordersFromEmail))+
      field('Orders vanuit connecties',fmt(growth?.email?.ordersFromConnections))+
      field('Websitebezoek → betaalde order',fmt(growth?.qualifiedOrders?.websiteToPaidOrderRate))+
      field('Commerciële uitkomstbewijsstatus',badge(growth?.qualifiedOrders?.status))+'</div>'+
    '<h4>CRO-prioriteiten voor de bestaande agents</h4>'+
    (Array.isArray(growth?.priorities)&&growth.priorities.length?
      '<div class="od-scroll"><table><thead><tr><th>Prioriteit</th><th>Eigenaar</th><th>Oorzaak</th><th>Volgende gecontroleerde verbetering</th></tr></thead><tbody>'+
      growth.priorities.slice(0,7).map(r=>'<tr><td>'+esc(r.code)+'</td><td>'+esc(r.owner)+'</td><td>'+
        esc(r.reason)+'</td><td>'+esc(r.action)+'</td></tr>').join('')+'</tbody></table></div>':
      '<p>Geen controleerbare CRO-prioriteiten uit de huidige bron vastgesteld.</p>')+
    '<p class="od-foot">Een stijging in likes, views of replies mag nooit worden vertaald naar orders zonder echte attributie en betaling. Alle voorstellen hier zijn nog geen uitgevoerde experimenten. Ontbrekende providerdekking is onbekend, niet nul; CRO alleen opschalen na geldige treatment/holdout-uitkomsten en ONE BRAIN-readback.</p></section>'+
    '<section class="od-card"><h3>CRO-bronattributie · website-CTA naar LinkedIn, Instagram en e-mail</h3>'+
    '<p>Dezelfde oorspronkelijke Growth Events en ONE BRAIN-bron. Na analytics-toestemming koppelen beide bestaande website-meetmodules een vaste kanaalcategorie en dezelfde tabbladsessie aan de CTA. Geen extra tracker, nieuwe scheduler of identificatie van bezoekers.</p>'+
    '<p>Bronstatus: '+badge(acquisition?.status||'UNVERIFIED')+
      ' · Providerattributie: '+badge(acquisition?.providerAttributionVerified?'BEVESTIGD':'NIET ONAFHANKELIJK BEVESTIGD')+'</p>'+
    '<div class="od-grid">'+
      field('CTA-events met vastgelegde bron (14d, niet-bot-vlag)',fmt(acquisition?.observedCtaEvents))+
      field('Zonder toewijsbare bron',fmt(acquisition?.unattributedCtaEvents))+
      field('LinkedIn persoonlijk',fmt(acquisition?.byChannel?.linkedin_personal))+
      field('LinkedIn bedrijf',fmt(acquisition?.byChannel?.linkedin_company))+
      field('LinkedIn zonder kanaalbewijs',fmt(acquisition?.byChannel?.linkedin_unassigned))+
      field('Instagram',fmt(acquisition?.byChannel?.instagram))+
      field('E-mail',fmt(acquisition?.byChannel?.email))+
      field('Organisch zoeken',fmt(acquisition?.byChannel?.organic_search))+
      field('Betaald zoeken',fmt(acquisition?.byChannel?.paid_search))+
      field('Overige verwijzingen',fmt(acquisition?.byChannel?.referral))+'</div>'+
    '<p class="od-foot">Dit zijn geregistreerde CTA-bronlabels, geen geverifieerde personen, leads of orders. Bij ontbrekende events is de bronstatus onzeker; ontbrekende CTA-events betekenen niet dat websitebezoekers niets wilden. Orders uit social of e-mail pas na daadwerkelijke klant- en providerbetalingsreadback toeschrijven.</p></section>'+
    '<section class="od-card"><h3>Social CRO · LinkedIn persoonlijk, bedrijf en Instagram</h3>'+
    '<p>Dezelfde ONE BRAIN-bronnen, drie gescheiden kanalen. Meetvenster 48 uur na publicatie (±6 uur), afgelopen 7 dagen versus vorige 21 dagen. Minimaal vijf echte providerwaarnemingen per periode en per metriek. Geen identiteiten van kijkers.</p>'+
    '<p>Provider-meetbewijs: '+badge(social?.status||'UNAVAILABLE')+' · Exacte 48-uursmetingen: '+esc(fmt(social?.observedAlignedWindows))+
    ' · Website- en orderattributie: '+badge(social?.conversionClaim||'ONBEKEND')+'</p>'+
    (social?'<div class="od-scroll"><table><thead><tr><th>Kanaal</th><th>Posts</th><th>7d/voorgaande 21d gemeten</th><th>Views</th><th>Likes</th><th>Comments</th><th>Reposts</th><th>Clicks</th></tr></thead><tbody>'+
      (socialRows||'<tr><td colspan="8">Geen geverifieerde socialpostmetingen.</td></tr>')+'</tbody></table></div>':
      '<p class="od-warn">Socialmediabron niet onafhankelijk beschikbaar. Geen groei of daling vastgesteld.</p>')+
    '<p class="od-foot">Richtlijn: bereik en engagement zijn vroege signalen, geen orders. Gezaghebbende funnel: echte post/provider-ID → betrouwbaar gemeten interactie → toegeschreven website-CTA → gekwalificeerde lead → onafhankelijke betaling → toegepaste leerregel.</p></section>'+
    '<section class="od-card" data-original-cro-measurement><h3>CTA- en meetdekking · originele Powerhouse-bron</h3>'+
    '<p>Vergelijk uitsluitend de 7-daagse waarden uit dezelfde bron: pagina-events zonder botvlag, CTA-events, dagaggregatie en formulierintenties. Zonder onafhankelijk gecontroleerde bezoeker, conversie en event-ID is een nulmeting geen bewezen 0% conversie.</p>'+
    '<p>Meetstatus: '+badge(coverage?.status||'UNVERIFIED')+' · Broncontrole: '+esc(date(coverage?.observedAt))+'</p>'+
    '<div class="od-grid">'+field('Pagina-events zonder botvlag (7d)',fmt(coverage?.pageviewsNonRobotFlag7d))+
    field('Opgeslagen CTA-events (7d)',fmt(coverage?.ctaEvents7d))+
    field('CTA-events in dagbron (7d)',fmt(coverage?.dailyCtaEvents7d))+
    field('Formulierintenties (7d)',fmt(coverage?.formSubmitIntents7d))+
    field('CTA-events per pagina-event · géén klantconversie',coverage?.ctaToPageviewEventRatioPct===null||coverage?.ctaToPageviewEventRatioPct===undefined?'Niet vast te stellen':fmt(coverage.ctaToPageviewEventRatioPct)+'%')+'</div>'+
    '<p class="od-foot">Oorzaakstatus: '+esc(coverage?.reason||'ORIGINAL_SOURCE_UNAVAILABLE')+'. Meer bezoek leidt niet automatisch tot meer orders. De bestaande eventproducer → duurzame Netlify ontvangst → Supabase-event → dagaggregatie moet met identiek event-ID worden gecontroleerd vóór een CRO-upliftbesluit.</p>'+
    '<div data-cro-ingest-freshness><h4>Versheid van de oorspronkelijke website-eventbron</h4>'+
    '<p>Laatste opgeslagen eventtijd (gebeurtenistijd, géén bewijs van ontvangtijd): '+
    esc(moment(recency?.lastEventOccurredAt))+' · Bron gecontroleerd: '+
    esc(moment(recency?.sourceEvaluatedAt))+
    ' · Leeftijd van het laatste event: '+esc(fmt(recency?.eventAgeHours))+' uur</p>'+
    '<p>Versheidsstatus: '+badge(recency?.status||'UNVERIFIED')+
    ' · '+esc(recency?.reason||'Nog geen verifieerbaar eventbewijs')+'.</p>'+
    '<p class="od-foot">Geen recent opgeslagen event betekent niet dat er geen bezoekers of CTA-klikken waren en bewijst geen defecte queue. Controleer alleen echte, toegestane event-ID’s van de bestaande Netlify-queue naar Supabase, daarna onafhankelijke leads, betaalde orders en toepassing in ONE BRAIN. Geen testbezoek of 202-antwoord als commerciële conversie tellen.</p></div>'+
    '</section>'+
    '<section class="od-card"><h3>Bronbewijs voor leads, orders en experimenten</h3><p>De dagtotalen hierboven zijn observaties. Onderstaande bronbewijzen komen uit de bestaande Supabase-registraties. Ook een geregistreerde providerreferentie is nog geen onafhankelijk bevestigd betaalbewijs.</p><div class="od-grid">'+proofCards+'</div>'+
    '<p class="od-foot">Eventstatus: '+badge(proof?.eventStatus)+' · Leadstatus: '+badge(proof?.leadStatus)+' · Orderstatus: '+badge(proof?.orderStatus)+'</p>'+
    '<h4>Gerandomiseerde experimentcohorten</h4>'+
    (cohorts?'<div class="od-scroll"><table><thead><tr><th>Experiment</th><th>Bewijsstatus</th><th>Volwassen treatment / holdout</th><th>Minimum per arm</th></tr></thead><tbody>'+(cohortRows||'<tr><td colspan="4">Geen toegelaten, bewezen experimenten.</td></tr>')+'</tbody></table></div>':'<p>Controle- en behandelingscohorten zijn niet beschikbaar. Geen causale winnaar bevestigd.</p>')+
    '</section>'+
    (flags.length?'<div class="od-warn" role="status"><strong>Meetkwaliteit nog niet volledig bewezen</strong><p>'+esc(flags.join(' · '))+'</p><small>'+esc(data.quality?.message||'')+'</small></div>':'')+
    '<section class="od-card"><h3>Waar haken bezoekers af? · waargenomen websitegedrag</h3>'+
    '<p>Alleen geaggregeerde events met toestemming, zonder botverkeer. Het laatst zichtbare blok is geen bewezen vertrekreden. Niet elke browser verstuurt een vertrek-event.</p>'+
    '<div class="od-grid">'+behaviorCards+'</div>'+
    '<h4>Laatste zichtbare sectie bij vastgelegd vertrek</h4>'+
    '<div class="od-scroll"><table><thead><tr><th>Pagina</th><th>Laatst zichtbare sectie</th><th>Vertreksignalen</th><th>Daarvan onder 25% scroll</th></tr></thead><tbody>'+
    (behavior?(sectionRows||'<tr><td colspan="4">Geen bewezen sectie-exit-events binnen deze periode.</td></tr>'):'<tr><td colspan="4">Bron ontbreekt of is niet actueel.</td></tr>')+
    '</tbody></table></div></section>'+
    '<section class="od-card"><h3>CRO-experimentregister</h3>'+
    (experiments?'<p>'+fmt(experiments.length)+' experimenten uit de canonieke Powerhouse-bron. Ook geplande, onvolledige en afgekeurde proeven blijven zichtbaar.</p>':'<p>De experimentbron is niet beschikbaar; conclusies blijven open.</p>')+
    '<div class="od-controls"><label>Zoek experiment <input data-cro-search type="search" placeholder="Hypothese, pagina, experiment-ID"></label><label>Status <select data-cro-status><option value="">Alle statussen</option>'+
    (experiments?[...new Set(experiments.map(x=>x.status).filter(Boolean))].sort().map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join(''):'')+
    '</select></label></div>'+
    '<div class="od-scroll"><table><thead><tr><th>Experiment / pagina</th><th>Hypothese en varianten</th><th>Status</th><th>Meetpunt / steekproef</th><th>Causaal bewijs</th><th>Besluit / effect</th></tr></thead><tbody data-cro-rows>'+
    (experiments?experimentRows(experiments):'<tr><td colspan="6">Geen verifieerbare brondata.</td></tr>')+
    '</tbody></table></div></section>'+
    '<p class="od-foot">Beperkingen: bots, toestemming, meetdekking en definitieve orderattributie vereisen onafhankelijke controles. Waarden uit website-events zijn niet automatisch echte bezoekers, leads of omzet. Alleen gemachtigde beheerders krijgen dit globale websiteoverzicht.</p>'+
    '</section>';
  const search=container.querySelector('[data-cro-search]'),status=container.querySelector('[data-cro-status]'),body=container.querySelector('[data-cro-rows]');
  const filter=()=>{
    if(!experiments)return;
    const q=String(search.value||'').trim().toLocaleLowerCase('nl');
    const s=String(status.value||'');
    const filtered=experiments.filter(r=>(!s||r.status===s)&&(!q||[r.id,r.hypothesis,r.pagina,r.onderdeel,r.metric].join(' ').toLocaleLowerCase('nl').includes(q)));
    body.innerHTML=filtered.length?experimentRows(filtered):'<tr><td colspan="6">Geen experimenten voor deze filters.</td></tr>';
  };
  search?.addEventListener('input',filter);status?.addEventListener('change',filter);
}

export function mountOtherData(container,{fetchImpl=globalThis.fetch}={}){
  let cancelled=false;
  const active=()=>!cancelled&&container.isConnected&&container.closest('[data-page-id]')?.dataset.pageId==='andere-data';
  async function load(){
    container.innerHTML='<section class="cro-od"><p>Beveiligde website- en CRO-data worden gecontroleerd…</p></section>';
    let user=globalThis.netlifyIdentity?.currentUser?.()||null;
    if(!user){
      const identity=await ensureIdentityWidget();
      user=identity?.currentUser?.()||null;
    }
    if(!active())return;
    if(!user){
      container.innerHTML='<section class="cro-od"><h3>Andere data · toegang vereist</h3><p>Log in als Powerhouse-beheerder om de website- en CRO-gegevens te bekijken.</p><button type="button" data-cro-login>Inloggen</button></section>';
      container.querySelector('[data-cro-login]')?.addEventListener('click',async()=>{const identity=await ensureIdentityWidget();identity?.open?.('login');});
      return;
    }
    let token='';try{token=await user.jwt?.()||'';}catch{}
    if(!active())return;
    if(!token){container.textContent='Identiteitsbewijs niet beschikbaar.';return;}
    try{
      const response=await fetchImpl('/api/powerhouse-cro-other-data',{
        headers:{accept:'application/json',authorization:'Bearer '+token},
        credentials:'same-origin',cache:'no-store'
      });
      if(!active())return;
      if(response.status===403){container.textContent='Alleen de Powerhouse-beheerder heeft toegang tot de globale website- en experimentgegevens.';return;}
      if(response.status===401){container.textContent='De beheerderssessie is verlopen. Log opnieuw in.';return;}
      if(!response.ok){container.textContent='De gecontroleerde readback is niet beschikbaar (HTTP '+response.status+'). Er worden geen statistieken verzonnen.';return;}
      const data=await response.json();
      if(active()){render(container,data);container.querySelector('[data-cro-reload]')?.addEventListener('click',load);}
    }catch{
      if(active())container.textContent='De broncontrole kon niet worden afgerond. Meetresultaten blijven onbewezen.';
    }
  }
  void load();
  return {destroy(){cancelled=true;},refresh:load};
}
