const HEALTH = [
  ['Strategie',82],['Groei',74],['Operatie',68],['Organisatie',71],['Kennis',63],['Data & technologie',76],['Finance',81],['Risk & compliance',69],
];

const content = document.querySelector('.content');
const drawer = document.querySelector('#drawer');
const drawerContent = document.querySelector('#drawerContent');
const drawerClose = document.querySelector('#drawerClose');
const command = document.querySelector('#command');

function mountHealthGrid() {
  const healthGrid = document.querySelector('#healthGrid');
  if (!healthGrid || healthGrid.children.length) return;
  for (const [name, score] of HEALTH) {
    const card = document.createElement('button');
    card.className = 'card health';
    card.type = 'button';
    card.dataset.drawer = `health:${name}`;
    card.innerHTML = `<div class="health-top"><span>${name}</span><strong>${score}</strong></div><div class="bar" aria-hidden="true"><i style="width:${score}%"></i></div>`;
    healthGrid.append(card);
  }
}
mountHealthGrid();
const OVERVIEW_HTML = content.innerHTML;

const DRAWERS = {
  health: ['Bedrijfsstatus 72','Demo-opbouw: score → drivers → evidence → eigenaar → acties. In productie wordt deze projection permission-aware berekend uit het canonical read model.'],
  crm: ['CRM-integratie','Business diff, directe/dependente/voorspelde impact, owner, bewijs, tests en rollback verschijnen hier voordat een change kan worden geactiveerd.'],
  opportunity: ['AI-governance propositie','Extern signaal wordt pas managementinformatie na bronvertrouwen, contextmatch, relevantie en impactanalyse.'],
  knowledge: ['Kennisrisico','Toon betrokken processen, kennishouders, back-ups, freshness, bewijs en herstelacties zonder verborgen people-inference.'],
  trust: ['AI-verwerking','Purpose · dataklassen · geminimaliseerde velden · provider/model · retention · policy · outputtype · evidence. Geen persistente modelmemory.'],
  decision: ['Decision workspace','Alternatieven, rationale, affected goals, evidence, approvers en besluitstatus blijven bij elkaar zodat later zichtbaar is waarom een keuze is gemaakt.'],
  change: ['Business change','WORKING en ACTIVE blijven gescheiden. Review toont diff, impact, dependencies, tests, approvals, verificatie en rollback.'],
  agent: ['Agent Team','Alle specialisten werken via dezelfde AgentWork-objecten, policies, evidence, verificatie en learning. Geen eigen agentwaarheid.'],
  access: ['Effective Access','Toegang wordt berekend uit rol, team, object, veld, purpose, dataclass en tijdelijke grants. View geeft niet automatisch Export of AI Process.'],
  evidence: ['Evidence','Elke materiële conclusie is herleidbaar naar toegestane bronnen, freshness, verificatie en confidence.'],
};

function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function openDrawer(key) {
  const [title, text] = DRAWERS[key] ?? [`${key}`,'Contextuele objectdetails worden hier uit het permission-aware read model geladen.'];
  drawerContent.innerHTML = `<div class="eyebrow">Context</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><div class="processing"><strong>Waarom?</strong><br>Evidence, relaties, permissions en change history zijn altijd één interactie verwijderd.</div>`;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  drawerClose.focus();
}
function closeDrawer(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');}

const DOMAIN_VIEWS = {
  'Strategie': () => workspace({
    eyebrow:'Strategie', title:'Van keuze naar meetbaar resultaat', text:'Strategie, doelen, KPI’s, aannames, constraints en besluiten delen één traceerbare keten.',
    stats:[['82','strategy health'],['4','actieve doelen'],['2','besluiten nodig'],['3','aannames review']],
    sections:[
      ['Strategische richting', cards([
        ['North Star','Meer grip en lagere afhankelijkheid','Strategy · ACTIVE v4.2','evidence'],
        ['Goal 2027','Recurring revenue naar 70%','KPI coverage 4/5','decision'],
        ['Strategic choice','Enterprise focus boven losse consultancy','Menselijk goedgekeurd','evidence'],
      ])],
      ['Aannames & alignment', `<div class="split"><article class="card detail-card"><span class="tag risk">REVIEW</span><h3>Implementatiecapaciteit groeit mee</h3><p>Confidence 61% · 2 ondersteunende bronnen · 1 tegengesteld capaciteitsignaal.</p><button class="link-btn" data-drawer="evidence">Bekijk bewijs →</button></article><article class="card detail-card"><span class="tag opportunity">ALIGNED</span><h3>Website → propositie → roadmap</h3><p>De kernpropositie en actieve groeidoelen verwijzen naar dezelfde canonical objects.</p></article></div>`],
      ['Decision Inbox', table(['Besluit','Impact','Owner','Status'], [['CRM-integratie versnellen','Hoog','Directie','Review'],['Scale pricing experiment','Midden','Growth','Concept']])]
    ]
  }),
  'Groei': () => workspace({
    eyebrow:'Groei', title:'Revenue Engine', text:'Markt → segment → behoefte → propositie → offering → prijs → klant → opportunity → contract → revenue.',
    stats:[['€410K','opportunity potential'],['3.2×','qualified pipeline'],['€38K','pricing leakage'],['92%','top opportunity fit']],
    sections:[
      ['Commercial control', cards([['Pricing','4 actieve plannen','1 experiment · 1 review','change'],['Pipeline','€640K qualified','2 opportunities risk','evidence'],['Customer','14 expansion signals','3 churn risks','opportunity']])],
      ['Pricing consistency', `<article class="card detail-card"><div class="flow-row"><b>Canonical PricePlan €349</b><span>···→</span><b>Website €349</b><span>···→</span><b>Billing €299</b></div><p class="muted">Derived Finding: billing wijkt af van ACTIVE PricePlan. Het systeem corrigeert dit niet stilletjes.</p><button class="link-btn" data-drawer="change">Maak change proposal →</button></article>`],
      ['External opportunities', table(['Signaal','Contextmatch','Confidence','Actie'], [['AI governance vraag groeit','3 objecten','81%','Onderzoeken'],['Subsidie digitalisering','2 initiatives','74%','Kwalificeren']])]
    ]
  }),
  'Operatie': () => workspace({
    eyebrow:'Operatie', title:'Operationele Digital Twin', text:'Processen, capaciteit, bottlenecks, kwaliteit, leveranciers, systemen en kennis worden als één keten bestuurd.',
    stats:[['68','operations health'],['2','bottlenecks'],['8.2h','langste wachttijd'],['31%','rework hotspot']],
    sections:[
      ['Order-to-Cash', `<div class="card process-map"><button data-drawer="evidence">Order</button><span>···→</span><button class="warn-node" data-drawer="change">Validatie</button><span>···→</span><button>Approval</button><span>···→</span><button>Delivery</button><span>···→</span><button>Billing</button></div>`],
      ['Wat remt?', cards([['Validatie','8.2 uur gemiddelde wachttijd','31% rework · 2 systems','change'],['Knowledge handoff','1 kritieke kennishouder','3 processes affected','knowledge'],['Supplier API','Freshness attention','Laatst verified 47 min geleden','evidence']])],
      ['Automation opportunities', table(['Proces','Potentieel','Risico','Autonomie'], [['Invoice matching','6u/week','Laag','Prepare'],['Customer onboarding','9u/week','Midden','Approval']])]
    ]
  }),
  'Organisatie': () => workspace({
    eyebrow:'Organisatie', title:'Capabilities, ownership en kennis', text:'Niet alleen organogrammen: welke capabilities zijn nodig, wie draagt verantwoordelijkheid en waar zit operationele afhankelijkheid?',
    stats:[['71','organization health'],['63','knowledge health'],['3','ownership gaps'],['2','bus-factor risks']],
    sections:[
      ['Capability gaps', table(['Capability','Nu','Nodig','Gap'], [['Enterprise Sales','2.8','4.1','1.3'],['Implementation','3.2','3.8','0.6'],['AI Governance','2.4','4.0','1.6']])],
      ['Knowledge resilience', cards([['Finance closing','1 primaire expert','Freshness 18d · High criticality','knowledge'],['CRM configuration','2 experts','Document coverage 84%','evidence'],['Pricing rationale','Owner aanwezig','Review over 21d','decision']])],
      ['Ownership', `<article class="card detail-card"><div class="flow-row"><b>Goal</b><span>···→</span><b>Capability</b><span>···→</span><b>Process</b><span>···→</span><b>Role</b><span>···→</span><b>Team</b></div><p class="muted">Accountable, Responsible, Contributors, Reviewer en Approver blijven expliciete relaties.</p></article>`]
    ]
  }),
  'Data & Technologie': () => workspace({
    eyebrow:'Data & Technologie', title:'Systemen, data, integraties en AI', text:'Technische gezondheid wordt vertaald naar bedrijfsimpact, lineage, datakwaliteit, kosten en beheersbare autonomie.',
    stats:[['29','integraties healthy'],['2','degraded'],['76','data/tech health'],['0','failed']],
    sections:[
      ['Integration Health', table(['Integratie','Status','Freshness','Impact'], [['CRM → Portal','Healthy','2 min','Revenue'],['ERP → Finance','Healthy','8 min','Finance'],['Supplier API','Attention','47 min','Operations']])],
      ['Data lineage', `<article class="card detail-card"><div class="flow-row"><b>Revenue KPI</b><span>←</span><b>Metric</b><span>←</span><b>Dataset</b><span>←</span><b>Integration</b><span>←</span><b>ERP</b></div><button class="link-btn" data-drawer="evidence">Bekijk lineage →</button></article>`],
      ['AI Systems', table(['Use-case','Data','Autonomie','Governance'], [['Management Summary','Internal/Confidential','Advise','Approved'],['Integration recovery','Internal','L5 safe patterns','Approved'],['HR candidate ranking','Restricted','None','BLOCKED']])]
    ]
  }),
  'Uitvoering': () => workspace({
    eyebrow:'Uitvoering', title:'Van besluit naar geverifieerde impact', text:'Decision → Initiative → Project → Roadmap Item → Action → Change → Verification → Impact → Learning.',
    stats:[['12','open changes'],['4','review'],['2','high impact'],['1','blocked']],
    sections:[
      ['Change Center', cards([['BG-204 · CRM Integration','v8.3 → v8.4','HIGH IMPACT · Review nodig','change'],['BG-207 · Pricing experiment','Scale plan working version','Impact analysis','change'],['BG-209 · SEO schema fix','Verified','No regression','evidence']])],
      ['Roadmap & dependencies', `<article class="card detail-card"><div class="flow-row"><b>CRM</b><span>···→</span><b>Sales efficiency</b><span>···→</span><b>Onboarding</b><span>···→</span><b>Revenue goal</b></div><p class="muted">€310K expected value deelt dezelfde CRM-afhankelijkheid. Scenario-state blijft apart van ACTIVE.</p><button class="link-btn" data-drawer="change">Simuleer herplanning →</button></article>`],
      ['Impact', table(['Change','Expected','Observed','Verified'], [['CRM pilot','€110K','€84K','€79K · 80%'],['Onboarding automation','9u/week','7.8u/week','7.1u/week · 88%']])]
    ]
  }),
  'Mijn werk': () => workspace({
    eyebrow:'Mijn werk', title:'Eén persoonlijke inbox uit de hele Company Graph', text:'Acties, besluiten, reviews, approvals, blockers, AI-voorstellen en access reviews komen samen op prioriteit.',
    stats:[['4','vandaag'],['2','besluiten'],['3','reviews'],['1','blocked']],
    sections:[['Vandaag', table(['Werk','Bron','Deadline','Status'], [['Review CRM change','Change BG-204','Vandaag','Review'],['Besluit Scale pricing','Decision DEC-18','Morgen','Open'],['Access review externe adviseur','Trust','3 sep','Review'],['Kennisrisk owner toewijzen','Process Finance','5 sep','Open']])],['AI-voorstellen', cards([['Automatiseer safe token refresh','18 eerdere incidenten · 100% verified','Voorstel autonomie L5','agent'],['Consolideer pricing evidence','2 conflicterende bronnen','Prepare','evidence']])]
    ]
  }),
  'Model Library': () => workspace({
    eyebrow:'Model Library', title:'Alle modellen en canvassen blijven intact', text:'Het universele workspace-contract voegt owner, versie, completeness, quality, confidence, freshness, AI Review, evidence en history toe zonder modelvelden plat te slaan.',
    stats:[['12','modellen'],['8','active'],['3','review nodig'],['1','stale']],
    sections:[['Library', table(['Model','Completeness','Quality','Freshness'], [['Strategy DNA','92%','High','Current'],['Execution Canvas','84%','Medium','Current'],['AI Capability Model','78%','High','Review 4d'],['Due Diligence Canvas','69%','Medium','Stale']])],['AI Review', cards([['Strategy DNA','2 zwakke assumptions','Evidence review','evidence'],['Execution Canvas','1 ownership gap','Create action','decision'],['AI Capability','3 dependencies','Context available','evidence']])]
    ]
  }),
  'Trust & Governance': () => workspace({
    eyebrow:'Trust & Governance', title:'Wie mag wat, met welke data en welke AI?', text:'Access, privacy, AI Register, Agent Control, policies, compliance en evidence delen één governance graph.',
    stats:[['94','trust score'],['1','AI review'],['0','critical access risks'],['91%','evidence current']],
    sections:[
      ['Trust Map', `<div class="card process-map trust-map"><button data-drawer="access">People</button><span>···→</span><button data-drawer="access">Roles</button><span>···→</span><button data-drawer="trust">Data</button><span>···→</span><button data-drawer="trust">AI</button><span>···→</span><button data-drawer="agent">Agents</button><span>···→</span><button data-drawer="change">Systems</button></div>`],
      ['AI Register', table(['Use-case','Risk','Human oversight','Status'], [['Management Summary','Transparency','Available','Approved'],['Website Agent','Other','Policy-based','Approved'],['HR candidate ranking','Potential High Risk','Undefined','BLOCKED']])],
      ['Agent Team', cards([['Integration Specialist','L5 safe recovery','Verifying CRM health','agent'],['Risk Specialist','Advise/Prepare','Impact assessed','agent'],['QA Guardian','Verify','All protected gates green','agent']])],
      ['Access Center', `<article class="card detail-card"><h3>Effective Access · voorbeeldgebruiker</h3><div class="permission-grid"><span>Strategie <b>Full</b></span><span>Finance <b>View</b></span><span>HR <b>None</b></span><span>AI Process <b>3 use-cases</b></span></div><button class="link-btn" data-drawer="access">Waarom deze toegang? →</button></article>`]
    ]
  }),
  'Beheer': () => workspace({
    eyebrow:'Beheer', title:'Organisatie-instellingen en administratie', text:'Configuratie blijft gescheiden van dagelijkse managementaandacht. Gevoelige wijzigingen lopen via dezelfde Change- en Policy-engine.',
    stats:[['12','gebruikers'],['7','rollen'],['4','integraties'],['0','overdue invoices']],
    sections:[['Beheer', cards([['Gebruikers & rollen','Effective access en reviews','Policy controlled','access'],['Koppelingen','Bouwen en configureren','Health & cost','change'],['Facturen','Abonnement en facturen','Restricted permission','evidence']])],['Platform', table(['Onderdeel','Status','Laatste check'], [['Canonical contracts','Healthy','Nu'],['AI Data Gateway','Healthy','Nu'],['Portal parity','Healthy','Nu'],['Live preview smoke','Healthy','Nu']])]
    ]
  }),
};

function cards(items) {
  return `<div class="attention">${items.map(([title,text,meta,drawerKey]) => `<article class="card detail-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p><div class="meta-line">${escapeHtml(meta)}</div>${drawerKey?`<button class="link-btn" data-drawer="${escapeHtml(drawerKey)}">Open →</button>`:''}</article>`).join('')}</div>`;
}

function table(headers, rows) {
  return `<div class="card table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>`<${i===0?'th':'td'}>${escapeHtml(cell)}</${i===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function workspace({eyebrow,title,text,stats,sections}) {
  return `<div class="eyebrow">Preview · voorbeelddata · geen actieve bedrijfswaarheid</div><section class="workspace-hero"><div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p></div><button class="context-ai" data-drawer="evidence">AI Review · Waarom?</button></section><div class="metrics workspace-metrics">${stats.map(([value,label])=>`<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join('')}</div>${sections.map(([heading,body])=>`<section class="section"><div class="section-head"><h2>${escapeHtml(heading)}</h2></div>${body}</section>`).join('')}`;
}

function setCurrentRoute(label) {
  document.querySelectorAll('.sidebar button').forEach(button => {
    if (button.textContent.trim() === label) button.setAttribute('aria-current','page');
    else button.removeAttribute('aria-current');
  });
}

function renderRoute(label) {
  closeDrawer();
  if (label === 'Overzicht') {
    content.innerHTML = OVERVIEW_HTML;
    mountHealthGrid();
  } else if (DOMAIN_VIEWS[label]) {
    content.innerHTML = DOMAIN_VIEWS[label]();
  } else return false;
  setCurrentRoute(label);
  document.querySelector('.main')?.scrollTo?.({top:0,behavior:'instant'});
  return true;
}

const ROUTE_ALIASES = new Map([
  ['home','Overzicht'],['overzicht','Overzicht'],['strategie','Strategie'],['groei','Groei'],['operatie','Operatie'],['organisatie','Organisatie'],
  ['data & technologie','Data & Technologie'],['data en technologie','Data & Technologie'],['uitvoering','Uitvoering'],['wijzigingen','Uitvoering'],['changes','Uitvoering'],
  ['mijn werk','Mijn werk'],['werk','Mijn werk'],['model library','Model Library'],['trust & governance','Trust & Governance'],['trust','Trust & Governance'],['beheer','Beheer'],['meer','Beheer'],
]);

function routeFromText(text) { return ROUTE_ALIASES.get(text.trim().toLowerCase()) ?? null; }

document.addEventListener('click', event => {
  const sidebarButton = event.target.closest('.sidebar button');
  if (sidebarButton && renderRoute(sidebarButton.textContent.trim())) return;

  const mobileButton = event.target.closest('.mobile-nav button');
  if (mobileButton) {
    const label = mobileButton.textContent.trim();
    if (label === 'AI') { command?.focus(); return; }
    const route = routeFromText(label);
    if (route) renderRoute(route);
    return;
  }

  const topButton = event.target.closest('.top-actions button');
  if (topButton?.getAttribute('aria-label') === 'Wijzigingen') { renderRoute('Uitvoering'); return; }

  const trigger = event.target.closest('[data-drawer]');
  if (trigger) { openDrawer(trigger.dataset.drawer); return; }
  const node = event.target.closest('[data-node]');
  if (node) {
    document.querySelectorAll('[data-node]').forEach(n => n.setAttribute('aria-pressed', String(n===node)));
    document.querySelectorAll('#businessGraph .edge').forEach(e => e.classList.add('active'));
    openDrawer(node.dataset.node);
  }
});

drawerClose?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeDrawer();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k') { event.preventDefault(); command?.focus(); }
});

command?.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const query = event.currentTarget.value.trim();
  if (!query) return;
  const directRoute = [...ROUTE_ALIASES.entries()].find(([alias]) => query.toLowerCase() === alias)?.[1];
  if (directRoute) { renderRoute(directRoute); event.currentTarget.value=''; return; }
  drawerContent.innerHTML = `<div class="eyebrow">Vraag Bedrijfsgeheugen</div><h2>${escapeHtml(query)}</h2><p>Deze preview voert geen echte AI-call uit. De productievariant stuurt de vraag uitsluitend via Permission Engine → AI Use Case → Context Broker → approved provider → Result Gateway.</p><div class="processing"><strong>Preview safety</strong><br>Geen bedrijfsdata wordt vanuit deze demo naar een model gestuurd.</div>`;
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); drawerClose.focus();
});
