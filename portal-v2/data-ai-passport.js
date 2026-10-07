const VERIFIED_AT='2026-10-07';

export const PROVIDER_REGISTRY=Object.freeze([
  Object.freeze({
    id:'supabase',
    name:'Supabase',
    role:'Primaire tenantdata, portal-state, runtime-evidence en operationele registers',
    status:'verified_eu',
    statusLabel:'EU-locatie geverifieerd',
    customerFlow:'direct',
    data:'Bedrijfsdata, tenant-state, audit-/runtime-evidence en operationele metadata afhankelijk van de gebruikte module.',
    processing:'Frankfurt, Duitsland · eu-central-1',
    storage:'Primaire projectdatabase: Frankfurt, Duitsland · eu-central-1',
    backup:'Niet afzonderlijk bewezen in dit dashboard; provider/DPA blijft de bron voor backup- en subprocessor-details.',
    jurisdiction:'EU primaire projectregio',
    retention:'Per dataset en doel. Waar een concrete bewaartermijn is ingericht wordt die per dataset getoond; er is geen verzonnen globale termijn.',
    training:'Niet van toepassing op database-opslag.',
    transfer:'Primaire projectdata staat aantoonbaar in de EU. Overige providerprocessen worden niet als EU-only geclaimd zonder bewijs.',
    evidence:'Live projectconfiguratie: eu-central-1',
    evidenceType:'runtime-config',
    evidenceUrl:'https://supabase.com/docs/guides/platform/regions',
    verifiedAt:VERIFIED_AT
  }),
  Object.freeze({
    id:'netlify',
    name:'Netlify',
    role:'Website, klantportaal, serverless API-runtime en productiedeploys',
    status:'action_required',
    statusLabel:'Regio niet bewezen',
    customerFlow:'direct',
    data:'HTTP-verzoeken, authenticatie-/API-context en technische runtimegegevens. Bedrijfsdata hoort niet als primaire datastore in Netlify te leven.',
    processing:'Niet bewezen voor deze site. In netlify.toml is geen Functions-regio vastgezet.',
    storage:'Statische assets worden via het Netlify-netwerk geleverd; primaire klantdata hoort in Supabase. Deploy- en runtime-artefacten volgen Netlify-beleid.',
    backup:'Niet als afzonderlijke klantdatastore aangetoond.',
    jurisdiction:'Account- en regio-afhankelijk; huidige function processing-regio is niet bewijsbaar uit de repositoryconfiguratie.',
    retention:'Deploy-/runtime-logs en providerartefacten: nog niet gekoppeld aan een aantoonbare tenant-bewaartermijn.',
    training:'Niet van toepassing.',
    transfer:'Mogelijke verwerking buiten de EU zolang de Functions-regio niet expliciet is vastgezet en teruggelezen.',
    evidence:'netlify.toml bevat geen function region; providerdefault mag daarom niet als EU-borging worden gepresenteerd.',
    evidenceType:'repo-config-gap',
    evidenceUrl:'https://docs.netlify.com/build/configure-builds/file-based-configuration/#functions',
    verifiedAt:VERIFIED_AT
  }),
  Object.freeze({
    id:'github',
    name:'GitHub',
    role:'Broncode, CI/CD, pull requests, release- en delivery-evidence',
    status:'outside_eu',
    statusLabel:'Buiten-EU platform',
    customerFlow:'excluded',
    data:'Technische broncode en deliverymetadata. Klantinhoud en tenantpayloads horen hier niet terecht te komen.',
    processing:'GitHub.com · providerinfrastructuur',
    storage:'GitHub.com bewaart standaard data in de Verenigde Staten; deze repository draait op github.com, niet op een GHE.com data-residency tenant.',
    backup:'Volgens GitHub-platformbeleid; geen aparte Bedrijfsgeheugen-claim.',
    jurisdiction:'Verenigde Staten voor standaard GitHub.com dataopslag',
    retention:'Repositoryhistorie en CI-evidence volgens repository- en GitHub-instellingen.',
    training:'Niet van toepassing.',
    transfer:'Buiten-EU is acceptabel voor de bedoelde technische scope; klantpayloads zijn expliciet buiten deze datastroom geplaatst.',
    evidence:'Publieke repository op github.com + GitHub data-residency documentatie',
    evidenceType:'provider-topology',
    evidenceUrl:'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    verifiedAt:VERIFIED_AT
  }),
  Object.freeze({
    id:'notion',
    name:'Notion',
    role:'Documentatie, monitor-/kennisintegraties en geselecteerde synchronisaties',
    status:'unknown',
    statusLabel:'Workspace-regio niet bewezen',
    customerFlow:'conditional',
    data:'Alleen data die bewust naar een Notion-integratie of synchronisatie wordt gestuurd.',
    processing:'Niet bewezen voor de huidige Bedrijfsgeheugen-workspace.',
    storage:'Niet bewezen voor de huidige workspace. Notion biedt EU data residency voor daarvoor geconfigureerde Enterprise-workspaces; zonder bevestigde migratie mag EU-opslag niet worden aangenomen.',
    backup:'Bij EU data residency noemt Notion Frankfurt als primary en Ierland als backup; voor deze workspace is dat niet geverifieerd.',
    jurisdiction:'Account-/workspaceconfiguratie bepaalt de residentie.',
    retention:'Workspace- en contentbeleid; huidige concrete bewaartermijn is niet teruggelezen.',
    training:'Notion AI is geen automatisch onderdeel van deze registerregel; gebruik wordt alleen getoond als runtime-evidence dat aantoont.',
    transfer:'Onbekend totdat workspace residency en subprocessors aantoonbaar zijn vastgelegd.',
    evidence:'Integratie is technisch aanwezig; dataresidentie-instelling ontbreekt als geverifieerd bewijs.',
    evidenceType:'account-setting-missing',
    evidenceUrl:'https://www.notion.com/help/data-residency',
    verifiedAt:VERIFIED_AT
  }),
  Object.freeze({
    id:'anthropic',
    name:'Anthropic / Claude API',
    role:'AI-verwerking voor onder meer de serverfunctie /api/vraag',
    status:'outside_eu',
    statusLabel:'Opslag standaard VS',
    customerFlow:'direct',
    data:'Alleen de context die Bedrijfsgeheugen voor een concrete AI-vraag aan de API meestuurt; geen impliciete toegang tot alle tenantdata.',
    processing:'Anthropic kan verkeer standaard over de VS, Europa, Azië en Australië routeren, tenzij routing contractueel/configuratief wordt beperkt.',
    storage:'Anthropic vermeldt voor commerciële producten/API standaard opslag in de Verenigde Staten.',
    backup:'Providerbeheerd; geen Bedrijfsgeheugen-claim zonder contractbewijs.',
    jurisdiction:'Verenigde Staten voor standaardopslag; verwerking kan multi-region zijn.',
    retention:'Anthropic API: input en output standaard binnen 30 dagen verwijderd, behoudens productkeuze, ZDR-afspraak, safety/policy of wettelijke uitzonderingen.',
    training:'Commerciële API-input/output wordt volgens Anthropic standaard niet gebruikt voor modeltraining, tenzij expliciet anders gekozen/afgesproken.',
    transfer:'Internationale doorgifte is onderdeel van deze route zolang geen aantoonbare EU-only/ZDR-configuratie is vastgelegd.',
    evidence:'ANTHROPIC_API_KEY is de productie-AI-config voor /api/vraag; providerlocatie en retentie zijn gebaseerd op actuele Anthropic-documentatie.',
    evidenceType:'repo-config-plus-provider-policy',
    evidenceUrl:'https://privacy.claude.com/en/articles/7996890-where-are-your-servers-located-do-you-host-your-models-on-eu-servers',
    retentionUrl:'https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data',
    trainingUrl:'https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training',
    verifiedAt:VERIFIED_AT
  }),
  Object.freeze({
    id:'openai',
    name:'OpenAI / ChatGPT',
    role:'Interne ontwikkeling en operations waar ChatGPT bewust wordt gebruikt; niet automatisch de productie-AI van het klantportaal',
    status:'unknown',
    statusLabel:'Accountconfiguratie niet bewezen',
    customerFlow:'excluded',
    data:'Geen klantpayload verondersteld. Alleen wanneer een expliciete bedrijfsworkflow OpenAI aanroept wordt die route klantrelevant.',
    processing:'Afhankelijk van product, plan en data-residency/inference-instellingen; huidige Bedrijfsgeheugen-workspace is niet vanuit de applicatie geverifieerd.',
    storage:'Afhankelijk van product, plan en geconfigureerde residentie; geen EU-claim zonder accountbewijs.',
    backup:'Niet bewezen voor de huidige Bedrijfsgeheugen-workspace.',
    jurisdiction:'Account-/productconfiguratie afhankelijk.',
    retention:'Product-/workspace-instellingen afhankelijk.',
    training:'Product-/workspace-instellingen afhankelijk; deze pagina maakt daar zonder accountbewijs geen claim over.',
    transfer:'Niet als klantdatastroom geclassificeerd totdat runtime-evidence een expliciete route aantoont.',
    evidence:'Interne toolcategorie; geen bewezen productieprocessor voor klantdata in de huidige portalruntime.',
    evidenceType:'scope-boundary',
    evidenceUrl:'https://openai.com/business-data/',
    verifiedAt:VERIFIED_AT
  })
]);

const STATUS=Object.freeze({
  verified_eu:{label:'EU geverifieerd',tone:'good'},
  outside_eu:{label:'Buiten EU / doorgifte',tone:'warn'},
  action_required:{label:'Actie nodig',tone:'bad'},
  unknown:{label:'Niet bewezen',tone:'unknown'}
});

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arr=value=>Array.isArray(value)?value:[];
const providerById=id=>PROVIDER_REGISTRY.find(p=>p.id===id)||null;

export function providerForEvent(event={}){
  const hay=[event.source,event.layer,event.title,event.detail,event.rawType,event.category].filter(Boolean).join(' ').toLowerCase();
  if(/supabase|postgres|database|sql|migration/.test(hay))return 'supabase';
  if(/netlify|deploy|website|serverless|function/.test(hay))return 'netlify';
  if(/github|pull request|workflow|commit|merge|codeql|repository/.test(hay))return 'github';
  if(/notion/.test(hay))return 'notion';
  if(/anthropic|claude/.test(hay))return 'anthropic';
  if(/openai|chatgpt|gpt-/.test(hay))return 'openai';
  return null;
}

function eventDataCategory(event={}){
  const category=String(event.category||'').toLowerCase();
  if(category==='delivery')return 'Technische deliverymetadata';
  if(category==='knowledge')return 'Kennis-/documentmetadata';
  if(category==='error')return 'Technische diagnose';
  if(category==='platform')return 'Platform-/runtime-metadata';
  if(category==='agent')return 'Agent-/uitvoeringscontext';
  return 'Operationele metadata';
}

function normalizedEvents(state={}){
  const runtime=state?.portal?.runtime||state?.runtime||{};
  const events=arr(runtime?.observability?.events);
  return events.map((event,index)=>{
    const providerId=providerForEvent(event);
    const provider=providerById(providerId);
    return Object.freeze({
      id:String(event.id||`event-${index}`),
      occurredAt:String(event.occurredAt||''),
      providerId,
      provider:provider?.name||String(event.source||event.layer||'Niet geclassificeerd'),
      title:String(event.title||event.rawType||'Runtime-event'),
      status:String(event.status||'UNKNOWN'),
      category:eventDataCategory(event),
      processing:provider?.processing||'Niet geclassificeerd — eerst bewijs nodig',
      storage:provider?.storage||'Niet geclassificeerd — eerst bewijs nodig',
      raw:event
    });
  });
}

export function buildDataSovereigntyModel(state={}){
  const events=normalizedEvents(state);
  const today=new Date().toISOString().slice(0,10);
  const daily=events.filter(event=>event.occurredAt?.slice(0,10)===today).slice(-30).reverse();
  const detected=new Set(events.map(event=>event.providerId).filter(Boolean));
  const customerProviders=PROVIDER_REGISTRY.filter(p=>p.customerFlow!=='excluded'||detected.has(p.id));
  const summary={
    total:PROVIDER_REGISTRY.length,
    euVerified:PROVIDER_REGISTRY.filter(p=>p.status==='verified_eu').length,
    outsideEu:PROVIDER_REGISTRY.filter(p=>p.status==='outside_eu').length,
    unresolved:PROVIDER_REGISTRY.filter(p=>['unknown','action_required'].includes(p.status)).length,
    todayEvents:daily.length
  };
  return Object.freeze({providers:PROVIDER_REGISTRY,customerProviders,events,daily,summary,verifiedAt:VERIFIED_AT});
}

function badge(provider){
  const meta=STATUS[provider.status]||STATUS.unknown;
  return `<span class="dsp-badge ${meta.tone}">${esc(meta.label)}</span>`;
}
function field(label,value){return `<div><dt>${esc(label)}</dt><dd>${esc(value||'Niet bewezen')}</dd></div>`;}

function providerCard(provider){
  const flow=provider.customerFlow==='direct'?'Directe klantdatastroom':provider.customerFlow==='conditional'?'Alleen wanneer gekoppeld':'Buiten normale klantpayload';
  return `<article class="dsp-provider" data-provider="${esc(provider.id)}">
    <header><div><span class="dsp-provider-role">${esc(flow)}</span><h3>${esc(provider.name)}</h3></div>${badge(provider)}</header>
    <p class="dsp-role">${esc(provider.role)}</p>
    <dl>
      ${field('Welke data',provider.data)}
      ${field('Waar verwerkt',provider.processing)}
      ${field('Waar opgeslagen',provider.storage)}
      ${field('Backup / replica',provider.backup)}
      ${field('Jurisdictie',provider.jurisdiction)}
      ${field('Bewaartermijn',provider.retention)}
      ${field('Modeltraining',provider.training)}
      ${field('Doorgifte',provider.transfer)}
    </dl>
    <footer><span>Bewijs · ${esc(provider.evidence)} · gecontroleerd ${esc(provider.verifiedAt)}</span><a href="${esc(provider.evidenceUrl)}" target="_blank" rel="noopener noreferrer">Bron ↗</a></footer>
  </article>`;
}

function eventRow(event){
  const provider=providerById(event.providerId);
  const when=event.occurredAt?new Date(event.occurredAt).toLocaleString('nl-NL',{dateStyle:'short',timeStyle:'short'}):'Tijd onbekend';
  return `<article class="dsp-event"><time>${esc(when)}</time><div><strong>${esc(event.title)}</strong><span>${esc(event.provider)} · ${esc(event.category)}</span><small>Verwerking: ${esc(event.processing)}</small></div><span class="dsp-event-status">${esc(event.status)}</span>${provider?badge(provider):'<span class="dsp-badge unknown">Niet geclassificeerd</span>'}</article>`;
}

function flowNode(providerId,label,detail){
  const p=providerById(providerId);
  return `<div class="dsp-flow-node ${esc(STATUS[p?.status]?.tone||'unknown')}"><span>${esc(label)}</span><strong>${esc(p?.name||label)}</strong><small>${esc(detail)}</small></div>`;
}

function render(model,scope='self'){
  const providers=scope==='customer'?model.customerProviders:model.providers;
  return `<section class="dsp" data-dsp-scope="${esc(scope)}">
    <header class="dsp-hero">
      <div><span class="dsp-kicker">DATA-SOEVEREINITEIT · AI ACT · AVG · AUDITTRAIL</span><h3>Zie exact waar data heen gaat.</h3><p>Opslag, verwerking, AI, doorgifte en bewijs worden uit elkaar gehouden. Onbekend blijft onbekend; een providerlogo is geen compliancebewijs.</p></div>
      <div class="dsp-score"><strong>${model.summary.euVerified}/${model.summary.total}</strong><span>providers met EU-locatie expliciet bewezen</span></div>
    </header>
    <div class="dsp-tabs" role="tablist" aria-label="Transparantiescope">
      <button type="button" data-dsp-tab="self" aria-selected="${scope==='self'}">Bedrijfsgeheugen zelf</button>
      <button type="button" data-dsp-tab="customer" aria-selected="${scope==='customer'}">Mijn organisatie</button>
    </div>
    <div class="dsp-alert"><strong>Belangrijk:</strong> ${scope==='self'?'Dit is de infrastructuur- en leverancierskaart van Bedrijfsgeheugen.':'Dit is de klantweergave: alleen providers die rechtstreeks, conditioneel of aantoonbaar via runtime-events in jouw datastroom voorkomen.'} Geen enkele “groene” status betekent automatisch juridische compliance.</div>
    <section class="dsp-summary">
      <div><strong>${model.summary.euVerified}</strong><span>EU geverifieerd</span></div>
      <div><strong>${model.summary.outsideEu}</strong><span>Buiten-EU / doorgifte</span></div>
      <div><strong>${model.summary.unresolved}</strong><span>Nog te bewijzen / actie</span></div>
      <div><strong>${model.summary.todayEvents}</strong><span>runtime-events vandaag</span></div>
    </section>
    <section class="dsp-flow-wrap"><div class="dsp-section-head"><div><span>DATAROUTE</span><h4>Bron → verwerking → opslag → AI → bewijs</h4></div></div>
      <div class="dsp-flow">
        <div class="dsp-flow-node good"><span>01 · BRON</span><strong>Jouw organisatie</strong><small>Data blijft eigendom van de klant; alleen gekozen bronnen en context gaan de route in.</small></div>
        ${flowNode('netlify','02 · PORTAL/API','Serverless verwerking; exacte regio is nog niet bewezen.')}
        ${flowNode('supabase','03 · STATE/DATA','Primaire tenantopslag Frankfurt, eu-central-1.')}
        ${flowNode('anthropic','04 · AI','Alleen geselecteerde requestcontext; standaardopslag VS.')}
        <div class="dsp-flow-node good"><span>05 · EVIDENCE</span><strong>Audittrail</strong><small>Wat gebeurde, welke provider, welke status en welk bewijs blijft traceerbaar.</small></div>
      </div>
    </section>
    <section><div class="dsp-section-head"><div><span>VERWERKERSREGISTER</span><h4>Per provider: wat, waar, waarom en hoe lang</h4></div><small>Infrastructuursnapshot gecontroleerd ${esc(model.verifiedAt)}</small></div><div class="dsp-provider-grid">${providers.map(providerCard).join('')}</div></section>
    <section class="dsp-daily"><div class="dsp-section-head"><div><span>DAGELIJKSE TRANSPARANTIE</span><h4>Wat is er vandaag met jouw omgeving gebeurd?</h4></div></div>
      ${model.daily.length?model.daily.map(eventRow).join(''):'<div class="dsp-empty"><strong>Geen geverifieerde tenant-events beschikbaar voor vandaag.</strong><span>Er wordt geen activiteit verzonnen. Zodra de runtime-evidence binnenkomt, verschijnt hier provider, tijd, type verwerking en locatiecontext.</span></div>'}
    </section>
    <section class="dsp-actions"><div class="dsp-section-head"><div><span>OPEN CONTROLS</span><h4>Wat moet nog scherper worden geborgd?</h4></div></div>
      <ol>
        <li><strong>Netlify Functions-regio expliciet EU vastzetten én teruglezen.</strong><span>Zonder die readback blijft serverless processing “niet bewezen”.</span></li>
        <li><strong>Notion workspace data residency verifiëren.</strong><span>EU-residentie alleen groen maken na concrete workspace-bevestiging.</span></li>
        <li><strong>AI-routing per use-case vastleggen.</strong><span>Provider, model, contextcategorie, processinglocatie, opslag, retentie, training en human oversight per AI-functie.</span></li>
        <li><strong>GitHub als technische trust boundary bewaken.</strong><span>Geen klantpayloads in issues, logs, actions artefacts of broncode.</span></li>
        <li><strong>OpenAI/ChatGPT alleen als klantprocessor markeren wanneer runtime-evidence dat bewijst.</strong><span>Interne ontwikkeling is iets anders dan productie-inference.</span></li>
      </ol>
    </section>
  </section>`;
}

export function mountDataAiPassport(root,{domainState}={}){
  if(!root)return null;
  let scope='self';
  const state=()=>{try{return domainState?.get?.()||{};}catch{return {};}};
  const paint=()=>{
    const model=buildDataSovereigntyModel(state());
    root.innerHTML=render(model,scope);
    root.querySelectorAll('[data-dsp-tab]').forEach(button=>button.addEventListener('click',()=>{
      scope=button.dataset.dspTab==='customer'?'customer':'self';
      paint();
    }));
  };
  paint();
  const onRuntime=()=>paint();
  globalThis.addEventListener?.('bg:runtime-evidence',onRuntime);
  return Object.freeze({refresh:paint,destroy:()=>globalThis.removeEventListener?.('bg:runtime-evidence',onRuntime)});
}
