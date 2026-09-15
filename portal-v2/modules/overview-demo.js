/**
 * Demo-Overzicht — Portal V2
 *
 * Bouwt het Overzicht na volgens het vastgestelde design: elf blokken,
 * mobiel eerst. Draait UITSLUITEND voor klantslug 'demo'.
 *
 * De cijfers hieronder zijn demonstratiecijfers voor verkoop en ontwerp.
 * Ze mogen nooit op een klantpagina komen. De gate in isDemoCustomer() is
 * daarom de enige toegang; applyOverviewDashboard() valt voor elke andere
 * klant terug op de bestaande, uit klantdata afgeleide KPI-kaarten.
 */

const DEMO_SLUG = 'demo';

export const DEMO_OVERVIEW = Object.freeze({
  bedrijf: 'IJsselmonde Elektrotechniek B.V.',
  beheersing: { score: 72, delta: 6, deltaLabel: 't.o.v. vorige maand' },
  radar: [
    ['Strategie', 78], ['Mensen', 57], ['Processen', 63], ['Systemen', 73],
    ['Data & AI', 66], ['Commercie', 74], ['Governance', 74]
  ],
  advies: [
    ['Order-to-cash proces optimaliseren', 'Hoog', 'Middel'],
    ['Kennisrisico bij sleutelrollen verlagen', 'Hoog', 'Laag'],
    ['Data & AI-volwassenheid verhogen', 'Middel', 'Middel']
  ],
  compleetheid: {
    totaal: 68,
    domeinen: [
      ['Strategie', 85], ['Mensen & teams', 62], ['Processen', 71], ['Data & AI', 48],
      ['Systemen', 75], ['Financien', 80], ['Governance', 66], ['Commercie', 70]
    ]
  },
  domeinkaarten: [
    ['Strategie & sturing', 78, 'Goed op koers', 'op', [58, 63, 60, 68, 70, 75, 78]],
    ['Commercie & klant', 74, 'Stabiel', 'vlak', [70, 71, 69, 72, 71, 73, 74]],
    ['Operatie & processen', 63, 'Verbeter nodig', 'af', [71, 68, 67, 66, 64, 63, 63]],
    ['Mensen & teams', 57, 'Aandacht nodig', 'af', [67, 64, 63, 61, 59, 58, 57]],
    ['Data & AI', 66, 'Op weg', 'op', [48, 52, 55, 59, 62, 64, 66]],
    ['Systemen & technologie', 73, 'Stabiel', 'vlak', [68, 70, 71, 70, 72, 73, 73]]
  ],
  projecten: {
    actief: 7, gepland: 12, afgerond: 5,
    rijen: [
      ['Order-to-cash optimalisatie', 65, '15 mei', 'Hoog'],
      ['CRM naar AFAS koppeling', 80, '30 apr', 'Hoog'],
      ['Kennismatrix & borging', 40, '30 jun', 'Middel'],
      ['AI-kansen implementatie', 25, '31 aug', 'Middel'],
      ['Dashboarding & BI-verbetering', 70, '15 jul', 'Middel']
    ]
  },
  uren: { geschreven: 32.5, budget: 80, gerealiseerd: 32.5, resterend: 47.5 },
  facturen: [['Concept', 2450, ''], ['Verstuurd', 8950, ''], ['Achterstallig', 1200, 'alarm']],
  signalen: [
    ['Concurrentieanalyse IJsselmonde', 'Hogere energieprijzen impact marges', 'Hoog'],
    ['Nieuwe wetgeving: NIS2', 'Invloed op cybersecurity en leveranciers', 'Medium'],
    ['Arbeidsmarkt regio Rotterdam', 'Tekort aan technisch personeel stijgt', 'Medium']
  ],
  activiteit: [
    ['Strategie-update Q1 2026', '2 uur geleden'],
    ['Nieuwe koppeling met AFAS', 'Vandaag'],
    ['Dashboard Commercie bijgewerkt', 'Gisteren'],
    ['Wijziging in proces: Offertetraject', '3 dagen geleden']
  ],
  documenten: [
    ['Strategisch plan 2026-2029', '2 uur geleden'],
    ['Processenhandboek v2.1', 'Gisteren'],
    ['Klantcase IJsselmonde 2026', '2 dagen geleden'],
    ['Kennismatrix IJsselmonde', '3 dagen geleden']
  ],
  aandacht: [
    ['Offerte OF-2026-014 vereist handtekening', 'alarm', 'offerte'],
    ['7 acties zonder eigenaar', 'alarm', 'actieve-acties'],
    ['2 rollen met hoog kennisrisico', 'let-op', 'mensen'],
    ['Factuur 2026-045 nog niet verstuurd', 'let-op', 'offerte'],
    ['Update strategie-doelstellingen', 'goed', 'strategiemodellen']
  ],
  snelStarten: [
    ['Nieuwe taak aanmaken', 'taken-werkstromen'],
    ['Nieuw project starten', 'roadmap'],
    ['Canvas starten', 'canvassen'],
    ['Strategiemodel openen', 'strategiemodellen'],
    ['AI-vraag stellen', 'ai-scan']
  ],
  directNaar: [
    ['Mijn acties', 12, 'actieve-acties'], ['Backlog', 44, 'taken-werkstromen'],
    ['Mijn projecten', 7, 'roadmap'], ['Mijn documenten', null, 'documenten'],
    ['Instellingen', null, 'instellingen']
  ]
});

const esc = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = value => new Intl.NumberFormat('nl-NL',
  { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
const nl1 = value => new Intl.NumberFormat('nl-NL',
  { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value || 0);

export function isDemoCustomer(state = {}) {
  const slug = state?.portal?.klant || state?.klant || state?.customer?.slug;
  return String(slug || '').toLowerCase() === DEMO_SLUG;
}

function radarSvg(punten, size = 190) {
  const c = size / 2, r = size / 2 - 34, n = punten.length;
  const hoek = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const ring = f => punten.map((_, i) =>
    `${c + Math.cos(hoek(i)) * r * f},${c + Math.sin(hoek(i)) * r * f}`).join(' ');
  const vlek = punten.map(([, waarde], i) => {
    const straal = r * waarde / 100;
    return `${c + Math.cos(hoek(i)) * straal},${c + Math.sin(hoek(i)) * straal}`;
  }).join(' ');
  const labels = punten.map(([naam, waarde], i) => {
    const lr = r + 20, x = c + Math.cos(hoek(i)) * lr, y = c + Math.sin(hoek(i)) * lr;
    const anchor = Math.abs(x - c) < 12 ? 'middle' : (x > c ? 'start' : 'end');
    return `<text class="ovz-ras" x="${x.toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="${anchor}">${esc(naam)}</text><text class="ovz-raswaarde" x="${x.toFixed(1)}" y="${(y + 9).toFixed(1)}" text-anchor="${anchor}">${waarde}</text>`;
  }).join('');
  return `<svg class="ovz-radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar met ${n} domeinen">${[1, .75, .5, .25].map(f => `<polygon points="${ring(f)}" class="ovz-ring"/>`).join('')}<polygon points="${vlek}" class="ovz-vlek"/>${labels}</svg>`;
}

function sparkline(reeks, richting) {
  const max = Math.max(...reeks), min = Math.min(...reeks), bereik = (max - min) || 1;
  const punten = reeks.map((v, i) =>
    `${(i / (reeks.length - 1) * 100).toFixed(1)},${(26 - (v - min) / bereik * 22).toFixed(1)}`).join(' ');
  return `<svg class="ovz-spark ovz-${richting}" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${punten}"/></svg>`;
}

function ring(percentage) {
  const omtrek = 2 * Math.PI * 52;
  return `<svg class="ovz-donut" viewBox="0 0 120 120" role="img" aria-label="Compleetheid ${percentage} procent"><circle class="ovz-donutspoor" cx="60" cy="60" r="52"/><circle class="ovz-donutvul" cx="60" cy="60" r="52" stroke-dasharray="${(omtrek * percentage / 100).toFixed(1)} ${omtrek.toFixed(1)}"/><text x="60" y="58" class="ovz-donutcijfer">${percentage}<tspan class="ovz-pct">%</tspan></text><text x="60" y="76" class="ovz-donutlabel">Compleet</text></svg>`;
}

const knop = (label, pagina) =>
  `<button type="button" data-pv-page="${esc(pagina)}">${esc(label)}</button>`;

function blokBeheersing(d) {
  return `<section class="ovz-kaart ovz-breed"><h2>Organisatiebeheersing</h2><div class="ovz-beheersing"><div><p class="ovz-cijfer">${d.beheersing.score}<span>/100</span></p><p class="ovz-uitleg">Mate van grip op strategie, mensen, processen, data, systemen en resultaten.</p><p class="ovz-delta ovz-op">${d.beheersing.delta} punten ${esc(d.beheersing.deltaLabel)}</p></div>${radarSvg(d.radar)}</div></section>`;
}

function blokAdvies(d) {
  return `<section class="ovz-kaart"><h2>AI-advies</h2><p class="ovz-sub">Gegenereerd op basis van alles wat je hebt ingevuld, verbonden data en externe bronnen.</p><p class="ovz-lead">Je organisatie is op de goede weg, maar 3 verbeterpunten vragen prioriteit.</p><ol class="ovz-advies">${d.advies.map(([titel, impact, effort], i) => `<li><span class="ovz-nr">${i + 1}</span><div><b>${esc(titel)}</b><em>Impact: <i class="ovz-${impact.toLowerCase()}">${esc(impact)}</i> &middot; Effort: ${esc(effort)}</em></div></li>`).join('')}</ol>${knop('Bekijk volledig advies', 'advies')}</section>`;
}

function blokCompleetheid(d) {
  return `<section class="ovz-kaart"><h2>Compleetheid</h2><div class="ovz-compleet">${ring(d.compleetheid.totaal)}<ul class="ovz-domeinlijst">${d.compleetheid.domeinen.map(([naam, pct]) => `<li><span>${esc(naam)}</span><div class="ovz-spoor"><div class="ovz-vul" style="width:${pct}%"></div></div><b>${pct}%</b></li>`).join('')}</ul></div>${knop('Bekijk wat nog openstaat', 'gegevens-invullen')}</section>`;
}

function blokDomeinkaarten(d) {
  return `<section class="ovz-kaart ovz-breed ovz-kaartjes">${d.domeinkaarten.map(([naam, score, status, richting, reeks]) => `<article><small>${esc(naam)}</small><strong>${score}<span>/100</span></strong><em class="ovz-${richting}">${esc(status)}</em>${sparkline(reeks, richting)}</article>`).join('')}</section>`;
}

function blokProjecten(d) {
  return `<section class="ovz-kaart"><h2>Projecten en roadmap</h2><p class="ovz-chips"><span class="ovz-chip ovz-actief">Actief ${d.projecten.actief}</span><span class="ovz-chip">Gepland ${d.projecten.gepland}</span><span class="ovz-chip">Afgerond ${d.projecten.afgerond}</span></p><ul class="ovz-projecten">${d.projecten.rijen.map(([naam, pct, deadline, impact]) => `<li><b>${esc(naam)}</b><div class="ovz-spoor"><div class="ovz-vul" style="width:${pct}%"></div></div><em>${pct}% &middot; ${esc(deadline)} &middot; impact ${esc(impact)}</em></li>`).join('')}</ul>${knop('Bekijk alle projecten en roadmap', 'roadmap')}</section>`;
}

function blokUren(d) {
  const pct = Math.round(d.uren.geschreven / d.uren.budget * 100);
  return `<section class="ovz-kaart"><h2>Uren en facturen <small>Deze maand</small></h2><p class="ovz-cijfer ovz-klein">${nl1(d.uren.geschreven)}<span>/ ${d.uren.budget} uur</span></p><div class="ovz-spoor"><div class="ovz-vul" style="width:${pct}%"></div></div><p class="ovz-uitleg">${pct}% &middot; gerealiseerd ${nl1(d.uren.gerealiseerd)} uur &middot; resterend ${nl1(d.uren.resterend)} uur</p><ul class="ovz-facturen">${d.facturen.map(([status, bedrag, toon]) => `<li class="ovz-${toon || 'rustig'}"><span>${esc(status)}</span><b>${euro(bedrag)}</b></li>`).join('')}</ul>${knop('Naar uren en facturen', 'taken-werkstromen')}</section>`;
}

function blokSignalen(d) {
  return `<section class="ovz-kaart"><h2>Externe signalen en acties</h2><p class="ovz-sub">AI selecteert wat relevant is voor jouw bedrijf.</p><ul class="ovz-signalen">${d.signalen.map(([titel, toelichting, niveau]) => `<li><div><b>${esc(titel)}</b><em>${esc(toelichting)}</em></div><span class="ovz-chip ovz-${niveau.toLowerCase()}">${esc(niveau)}</span></li>`).join('')}</ul>${knop('Bekijk alle signalen en acties', 'actieve-acties')}</section>`;
}

function blokLijst(titel, rijen, label, pagina) {
  return `<section class="ovz-kaart"><h2>${esc(titel)}</h2><ul class="ovz-tijdlijn">${rijen.map(([naam, wanneer]) => `<li><span>${esc(naam)}</span><em>${esc(wanneer)}</em></li>`).join('')}</ul>${knop(label, pagina)}</section>`;
}

function blokAandacht(d) {
  return `<section class="ovz-kaart"><h2>Wat vraagt jouw aandacht vandaag?</h2><ul class="ovz-aandacht">${d.aandacht.map(([titel, toon, pagina]) => `<li class="ovz-${toon}"><span class="ovz-stip"></span><b>${esc(titel)}</b><button type="button" data-pv-page="${esc(pagina)}">Bekijk</button></li>`).join('')}</ul>${knop('Naar mijn taken', 'taken-werkstromen')}</section>`;
}

function blokZijkolom(d) {
  return `<aside class="ovz-kaart ovz-zij"><p class="ovz-bedrijf">${esc(d.bedrijf)}</p><h3>Snel starten</h3><div class="ovz-snel">${d.snelStarten.map(([label, pagina]) => knop(label, pagina)).join('')}</div><h3>Direct naar</h3><div class="ovz-snel">${d.directNaar.map(([label, aantal, pagina]) => knop(aantal == null ? label : `${label} (${aantal})`, pagina)).join('')}</div></aside>`;
}

const STIJL = `
.ovz{display:grid;gap:14px;padding:4px 0 32px}
.ovz-kaart{background:var(--pv-card,#fff);border:1px solid var(--pv-line,#e3e8f0);border-radius:16px;padding:18px}
.ovz-kaart h2{font-size:15px;margin:0 0 4px;display:flex;justify-content:space-between;align-items:baseline}
.ovz-kaart h2 small{font-weight:500;font-size:12px;color:var(--pv-muted,#5b6b82)}
.ovz-kaart h3{font-size:13px;margin:18px 0 8px;color:var(--pv-muted,#5b6b82)}
.ovz-sub,.ovz-uitleg{font-size:13px;color:var(--pv-muted,#5b6b82);margin:2px 0 10px}
.ovz-lead{font-weight:600;margin:10px 0}
.ovz-cijfer{font-size:50px;font-weight:700;letter-spacing:-.03em;margin:6px 0 4px;line-height:1}
.ovz-cijfer span{font-size:16px;font-weight:500;color:var(--pv-muted,#5b6b82)}
.ovz-cijfer.ovz-klein{font-size:34px}
.ovz-delta{font-size:13px;margin:0}
.ovz-op{color:#1c7c54}.ovz-af{color:#c02b3c}.ovz-vlak{color:var(--pv-muted,#5b6b82)}
.ovz-beheersing{display:grid;gap:10px;align-items:center}
.ovz-radar{width:100%;max-width:230px;justify-self:center}
.ovz-ring{fill:none;stroke:var(--pv-line,#e3e8f0)}
.ovz-vlek{fill:var(--pv-accent,#1d4ed8);fill-opacity:.2;stroke:var(--pv-accent,#1d4ed8);stroke-width:1.5}
.ovz-ras{font-size:8px;fill:var(--pv-muted,#5b6b82)}
.ovz-raswaarde{font-size:9px;font-weight:700;fill:var(--pv-accent,#1d4ed8)}
.ovz-spoor{height:6px;background:var(--pv-soft,#f1f4fa);border-radius:99px;overflow:hidden;margin:5px 0}
.ovz-vul{height:100%;background:var(--pv-accent,#1d4ed8);border-radius:99px}
.ovz-advies{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ovz-advies li{display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:start}
.ovz-nr{width:22px;height:22px;border-radius:99px;background:var(--pv-soft,#f1f4fa);display:grid;place-items:center;font-size:12px;font-weight:700}
.ovz-advies em{font-style:normal;display:block;font-size:12px;color:var(--pv-muted,#5b6b82)}
.ovz-hoog{color:#c02b3c;font-style:normal}.ovz-middel{color:#b45309;font-style:normal}
.ovz-compleet{display:grid;gap:14px;justify-items:center}
.ovz-donut{width:120px}
.ovz-donutspoor{fill:none;stroke:var(--pv-soft,#f1f4fa);stroke-width:12}
.ovz-donutvul{fill:none;stroke:var(--pv-accent,#1d4ed8);stroke-width:12;stroke-linecap:round;transform:rotate(-90deg);transform-origin:60px 60px}
.ovz-donutcijfer{text-anchor:middle;font-size:30px;font-weight:700;fill:currentColor}
.ovz-pct{font-size:14px}
.ovz-donutlabel{text-anchor:middle;font-size:10px;fill:var(--pv-muted,#5b6b82)}
.ovz-domeinlijst{list-style:none;margin:0;padding:0;width:100%;display:grid;gap:7px}
.ovz-domeinlijst li{display:grid;grid-template-columns:1fr 70px 40px;gap:8px;align-items:center;font-size:13px}
.ovz-domeinlijst b{text-align:right;font-variant-numeric:tabular-nums}
.ovz-kaartjes{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.ovz-kaartjes article{border:1px solid var(--pv-line,#e3e8f0);border-radius:12px;padding:12px}
.ovz-kaartjes small{font-size:12px;color:var(--pv-muted,#5b6b82)}
.ovz-kaartjes strong{display:block;font-size:26px;font-weight:700;letter-spacing:-.02em}
.ovz-kaartjes strong span{font-size:13px;font-weight:500;color:var(--pv-muted,#5b6b82)}
.ovz-kaartjes em{font-style:normal;font-size:12px}
.ovz-spark{width:100%;height:30px;margin-top:6px}
.ovz-spark polyline{fill:none;stroke-width:2;stroke:currentColor}
.ovz-chips{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px}
.ovz-chip{font-size:12px;padding:3px 9px;border-radius:99px;background:var(--pv-soft,#f1f4fa)}
.ovz-chip.ovz-actief{background:var(--pv-accent,#1d4ed8);color:#fff}
.ovz-projecten,.ovz-signalen,.ovz-tijdlijn,.ovz-facturen,.ovz-aandacht{list-style:none;margin:0 0 12px;padding:0;display:grid;gap:10px}
.ovz-projecten em,.ovz-signalen em,.ovz-tijdlijn em{font-style:normal;font-size:12px;color:var(--pv-muted,#5b6b82)}
.ovz-signalen li,.ovz-tijdlijn li,.ovz-facturen li{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:14px}
.ovz-facturen li{border-top:1px solid var(--pv-line,#e3e8f0);padding-top:8px}
.ovz-facturen li.ovz-alarm b{color:#c02b3c}
.ovz-aandacht li{display:grid;grid-template-columns:8px 1fr auto;gap:10px;align-items:center;font-size:14px}
.ovz-stip{width:8px;height:8px;border-radius:99px;background:var(--pv-muted,#5b6b82)}
.ovz-aandacht .ovz-alarm .ovz-stip{background:#c02b3c}
.ovz-aandacht .ovz-let-op .ovz-stip{background:#b45309}
.ovz-aandacht .ovz-goed .ovz-stip{background:#1c7c54}
.ovz-bedrijf{font-weight:700;margin:0}
.ovz-snel{display:grid;gap:6px}
.ovz [data-pv-page]{border:1px solid var(--pv-line,#e3e8f0);background:var(--pv-card,#fff);border-radius:10px;padding:9px 12px;font:inherit;font-size:13px;font-weight:600;text-align:left;cursor:pointer;color:inherit}
.ovz [data-pv-page]:hover{border-color:var(--pv-accent,#1d4ed8);color:var(--pv-accent,#1d4ed8)}
@media(min-width:780px){.ovz{grid-template-columns:repeat(2,1fr)}.ovz-breed{grid-column:1/-1}.ovz-beheersing{grid-template-columns:1fr auto}.ovz-compleet{grid-template-columns:auto 1fr;justify-items:start}}
@media(min-width:1180px){.ovz{grid-template-columns:repeat(3,1fr)}.ovz-zij{grid-row:span 2}}`;

function ensureStijl(doc) {
  if (doc.getElementById('ovz-demo-stijl')) return;
  const tag = doc.createElement('style');
  tag.id = 'ovz-demo-stijl';
  tag.textContent = STIJL;
  doc.head.appendChild(tag);
}

export function renderDemoOverview(root = document, data = DEMO_OVERVIEW) {
  const doel = root.querySelector?.('.main');
  if (!doel) return false;
  ensureStijl(root.ownerDocument || document);
  let houder = doel.querySelector('.ovz');
  if (!houder) {
    houder = (root.ownerDocument || document).createElement('div');
    doel.appendChild(houder);
  }
  houder.className = 'ovz';
  houder.dataset.demoData = 'true';
  houder.innerHTML = [
    blokBeheersing(data),
    blokAdvies(data),
    blokCompleetheid(data),
    blokDomeinkaarten(data),
    blokProjecten(data),
    blokUren(data),
    blokSignalen(data),
    blokAandacht(data),
    blokLijst('Recente activiteit', data.activiteit, 'Naar alle activiteit', 'wijzigingen'),
    blokLijst('Documenten en kennis', data.documenten, 'Naar documenten', 'documenten'),
    blokZijkolom(data)
  ].join('');
  doel.querySelector('.kpis')?.setAttribute('hidden', 'hidden');
  return true;
}
