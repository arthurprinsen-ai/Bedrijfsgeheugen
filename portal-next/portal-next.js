const HEALTH = [
  ['Strategie',82],['Groei',74],['Operatie',68],['Organisatie',71],['Kennis',63],['Data & technologie',76],['Finance',81],['Risk & compliance',69],
];

const healthGrid = document.querySelector('#healthGrid');
for (const [name, score] of HEALTH) {
  const card = document.createElement('button');
  card.className = 'card health';
  card.type = 'button';
  card.dataset.drawer = `health:${name}`;
  card.innerHTML = `<div class="health-top"><span>${name}</span><strong>${score}</strong></div><div class="bar" aria-hidden="true"><i style="width:${score}%"></i></div>`;
  healthGrid?.append(card);
}

const drawer = document.querySelector('#drawer');
const drawerContent = document.querySelector('#drawerContent');
const drawerClose = document.querySelector('#drawerClose');

const DRAWERS = {
  health: ['Bedrijfsstatus 72','Demo-opbouw: score → drivers → evidence → eigenaar → acties. In productie wordt deze projection permission-aware berekend uit het canonical read model.'],
  crm: ['CRM-integratie','Business diff, directe/dependente/voorspelde impact, owner, bewijs, tests en rollback verschijnen hier voordat een change kan worden geactiveerd.'],
  opportunity: ['AI-governance propositie','Extern signaal wordt pas managementinformatie na bronvertrouwen, contextmatch, relevantie en impactanalyse.'],
  knowledge: ['Kennisrisico','Toon betrokken processen, kennishouders, back-ups, freshness, bewijs en herstelacties zonder verborgen people-inference.'],
  trust: ['AI-verwerking','Purpose · dataklassen · geminimaliseerde velden · provider/model · retention · policy · outputtype · evidence. Geen persistente modelmemory.'],
};

function openDrawer(key) {
  const [title, text] = DRAWERS[key] ?? [`${key}`,'Contextuele objectdetails worden hier uit het permission-aware read model geladen.'];
  drawerContent.innerHTML = `<div class="eyebrow">Context</div><h2>${title}</h2><p>${text}</p><div class="processing"><strong>Waarom?</strong><br>Evidence en permissie-uitleg zijn altijd één interactie verwijderd.</div>`;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden','false');
  drawerClose.focus();
}
function closeDrawer(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');}

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-drawer]');
  if (trigger) openDrawer(trigger.dataset.drawer);
  const node = event.target.closest('[data-node]');
  if (node) {
    document.querySelectorAll('[data-node]').forEach(n => n.setAttribute('aria-pressed', String(n===node)));
    document.querySelectorAll('#businessGraph .edge').forEach(e => e.classList.add('active'));
    openDrawer(node.dataset.node);
  }
});
drawerClose?.addEventListener('click', closeDrawer);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase()==='k') { event.preventDefault(); document.querySelector('#command')?.focus(); } });

document.querySelector('#command')?.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const query = event.currentTarget.value.trim();
  if (!query) return;
  drawerContent.innerHTML = `<div class="eyebrow">Vraag Bedrijfsgeheugen</div><h2>${query.replace(/[<>]/g,'')}</h2><p>Deze preview voert geen echte AI-call uit. De productievariant stuurt de vraag uitsluitend via Permission Engine → AI Use Case → Context Broker → approved provider → Result Gateway.</p>`;
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); drawerClose.focus();
});
