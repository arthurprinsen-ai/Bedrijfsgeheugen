import { calculateLegacyEquivalent as calc } from './legacy-parity-engine.js';
import { brancheVergelijking, brancheProfiel, onderzoekVoor } from './external-data.js';
import { komendeMijlpalen } from './regelgeving.js';
import { beoordeelPortefeuille, rangschikRisicos, STATUS } from './compliance-engine.js';
import { bouwPassport } from './passport.js';
import { PROFILE_DIMENSIONS } from './modules/company-input.js';
import { doorwerking } from './doorwerking.js';

/**
 * Wat moet dit bedrijf aanpakken, en in welke volgorde?
 *
 * Waarom dit bestand er is
 * ------------------------
 * Het portaal rekende honderd getallen uit, vergeleek ze met branchenormen en
 * hield wetgeving bij — maar concludeerde niets. De pagina's `advies`,
 * `kansenkaart` en de berekening `blocker-ranking` lazen allemaal een lijst die
 * iemand met de hand had ingetypt. Met een volledig ingevuld bedrijf bleven ze
 * daarom leeg: het portaal liet zien wat je erin stopte, niet wat eruit volgde.
 *
 * Deze laag leidt bevindingen af uit wat er al is doorgerekend. Elke bevinding
 * draagt drie dingen, en zonder alle drie komt hij er niet in:
 *
 *   bewijs    het eigen cijfer, en waar het mee vergeleken is;
 *   waarde    wat het oplevert per jaar, of eerlijk leeg als dat niet te
 *             berekenen valt — een verzonnen bedrag is erger dan geen bedrag;
 *   bron      waar de norm of de verplichting vandaan komt.
 *
 * De volgorde is een uitkomst, geen mening: waarde per jaar, gecorrigeerd voor
 * hoeveel moeite het kost en of er een harde datum aan hangt.
 */

const arr = value => (Array.isArray(value) ? value : []);
const at = (state, pad) => String(pad || '').split('.').filter(Boolean)
  .reduce((waarde, sleutel) => (waarde == null ? undefined : waarde[sleutel]), state);
const n = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const euro = value => (value == null ? null : Math.round(value));

/** Moeite bepaalt hoe snel iets kan; een harde datum weegt zwaarder dan waarde. */
const MOEITE = Object.freeze({ klein: 1, middel: 2, groot: 3 });

function bevinding({ id, titel, bewijs, waarde = null, moeite = 'middel', bron, pagina, datum = null, soort, dim = null, duur = null }) {
  return { id, titel, bewijs, waarde: euro(waarde), moeite, bron, pagina, datum, soort, dim, duur };
}

/* ---------- de regels ---------- */

/** Handmatig werk: het meest concrete bedrag dat het portaal kan berekenen. */
function handmatigWerk(state) {
  const kosten = n(calc('manual-work-annual', state));
  if (!kosten) return [];
  const uren = n(at(state, 'portal.profile.manualHoursPerWeek'));
  return [bevinding({
    id: 'handmatig-werk', soort: 'kosten',
    titel: 'Handmatig werk automatiseren',
    bewijs: `${uren} uur per week handmatig werk kost ${kosten.toLocaleString('nl-NL')} euro per jaar`,
    waarde: kosten * 0.4,
    moeite: 'middel', bron: 'Eigen invoer: uren en uurkosten', pagina: 'ai-capabilities'
  })];
}

/** Eigen cijfers die onder de branchenorm liggen. */
function onderDeNorm(state) {
  const branche = at(state, 'portal.market.industry');
  const profiel = brancheProfiel(branche);
  /* Alleen vergelijken waar de klant iets heeft ingevuld. Een berekening geeft
     nul terug als de invoer ontbreekt, en dat nul kwam als "brutomarge 0%
     tegenover 38%" op het scherm - een bewering over een veld dat leeg is. */
  const ingevuld = (waarde, ...velden) =>
    velden.every(pad => n(at(state, pad))) ? n(waarde) : null;
  const rijen = brancheVergelijking({
    grossMargin: ingevuld(calc('gross-margin', state), 'portal.metrics.grossMargin'),
    ebitdaMargin: ingevuld(calc('ebitda-margin', state), 'portal.metrics.revenue', 'portal.metrics.ebitda'),
    wageRatio: ingevuld(calc('wage-ratio', state), 'portal.metrics.revenue', 'portal.metrics.wages'),
    marketingRatio: ingevuld(calc('marketing-ratio', state), 'portal.metrics.revenue', 'portal.metrics.marketing'),
    itRatio: ingevuld(calc('it-ratio', state), 'portal.metrics.revenue', 'portal.metrics.it'),
    dso: ingevuld(calc('dso', state), 'portal.metrics.dso'),
    absence: ingevuld(at(state, 'portal.people.absence'), 'portal.people.absence'),
    turnover: ingevuld(at(state, 'portal.people.turnover'), 'portal.people.turnover'),
    enps: ingevuld(at(state, 'portal.people.enps'), 'portal.people.enps')
  }, branche).filter(rij => !rij.beter);

  const omzet = n(at(state, 'portal.metrics.revenue'));
  return rijen.map(rij => {
    // Alleen waar het verschil eenduidig in geld is uit te drukken, komt er een
    // bedrag bij. Voor eNPS of verzuim zou dat gokken zijn.
    let waarde = null;
    if (rij.maatstaf === 'Brutomarge' && omzet) waarde = omzet * Math.abs(rij.verschil) / 100;
    if (rij.maatstaf === 'DSO' && omzet) waarde = omzet / 365 * Math.abs(rij.verschil) * 0.06;
    return bevinding({
      id: `norm-${rij.maatstaf.toLowerCase().replace(/\W+/g, '-')}`, soort: 'markt',
      titel: `${rij.maatstaf} wijkt ongunstig af van de norm in je sector`,
      bewijs: `${rij.eigen.toLocaleString('nl-NL')}${rij.eenheid} tegenover ${rij.norm.toLocaleString('nl-NL')}${rij.eenheid} in ${branche || 'het gemiddelde NL-bedrijf'}`,
      waarde, moeite: waarde ? 'groot' : 'middel',
      bron: `Branchenormen: CBS, Eurostat, DNB en sectorprognoses${profiel?.inst ? ` · ${profiel.inst}` : ''}`,
      pagina: rij.maatstaf === 'DSO' || rij.maatstaf === 'Brutomarge' ? 'cijfers-maatstaven' : 'mensen-organisatie'
    });
  });
}

/** Compliance: ontbrekende controls en verlopen bewijs. */
function complianceGaten(state) {
  const controls = arr(at(state, 'portal.compliance.controls'));
  if (!controls.length) return [];
  return rangschikRisicos(controls).slice(0, 4).map(risico => bevinding({
    id: `control-${risico.id}`, soort: 'verplichting',
    titel: `${risico.requirement || risico.id} is niet aantoonbaar op orde`,
    bewijs: risico.status === STATUS.EVIDENCE_MISSING
      ? 'De control is ingericht maar het bewijs ontbreekt of is verlopen'
      : 'De control is niet ingericht',
    waarde: null,
    moeite: risico.severity === 'critical' ? 'klein' : 'middel',
    bron: `Raamwerk ${risico.framework}`, pagina: 'compliance-command-center'
  }));
}

/** Wetgeving met een datum die eraan komt. */
function komendeVerplichtingen(state, peil) {
  return komendeMijlpalen(peil, 12).slice(0, 3).map(mijlpaal => bevinding({
    id: `regel-${mijlpaal.id}-${mijlpaal.datum}`, soort: 'verplichting',
    titel: mijlpaal.regel,
    bewijs: mijlpaal.wat,
    waarde: null, moeite: 'middel', datum: mijlpaal.datum,
    bron: 'Regelgevingsregister', pagina: 'compliance-governance'
  }));
}

/** Controls in het Data & AI Passport die nog niet bewezen zijn. */
function passportGaten(state) {
  const passport = bouwPassport(state);
  if (!passport.samenvatting.totaal) return [];
  const open = passport.controls.filter(control => control.status === 'action_required');
  return open.slice(0, 2).map(control => bevinding({
    id: `passport-${control.id}`, soort: 'verplichting',
    titel: `${control.label} vraagt actie`,
    bewijs: control.punt || control.uitleg,
    waarde: null, moeite: 'klein',
    bron: 'Data & AI Passport', pagina: 'data-ai-passport'
  }));
}

/** De businesscase die de klant zelf heeft ingevuld. */
function businesscase(state) {
  const baat = n(calc('risk-adjusted-benefit', state));
  if (!baat) return [];
  const terugverdien = n(calc('payback', state));
  return [bevinding({
    id: 'businesscase', soort: 'kans',
    titel: 'Doorpakken op de businesscase die al is doorgerekend',
    bewijs: terugverdien
      ? `Risicogewogen baat van ${baat.toLocaleString('nl-NL')} euro per jaar, terugverdiend in ${terugverdien.toFixed(1)} maanden`
      : `Risicogewogen baat van ${baat.toLocaleString('nl-NL')} euro per jaar`,
    waarde: baat, moeite: 'groot', bron: 'Eigen businesscase', pagina: 'businesscase'
  })];
}

/**
 * Het duurste handwerk per bedrijfsonderdeel. Dit was de motor onder het advies
 * van het oude portaal: elk ingevuld volwassenheidsniveau levert een bedrag per
 * jaar op, en het verschil met het streefniveau is wat er te winnen valt.
 */
function duursteOnderdelen(state) {
  const kosten = arr(calc('dimension-costs', state));
  return kosten.filter(d => d.potentieel > 500).slice(0, 3).map(d => bevinding({
    id: `onderdeel-${d.id}`, soort: 'kosten', dim: d.id,
    titel: `Haal het handwerk uit ${d.label.toLowerCase()}`,
    bewijs: `Op niveau ${d.niveau} kost dit onderdeel ${Math.round(d.kosten).toLocaleString('nl-NL')} euro per jaar; op niveau ${d.streefniveau} is dat ${Math.round(d.kosten - d.potentieel).toLocaleString('nl-NL')} euro`,
    waarde: d.potentieel,
    moeite: d.niveau <= 2 ? 'groot' : 'middel',
    duur: d.niveau <= 2 ? 8 : 4,
    bron: 'Eigen profiel: volwassenheid, medewerkers en uurkosten',
    pagina: 'ai-capabilities'
  }));
}

/**
 * Extern onderzoek, gericht op de onderdelen waar dit bedrijf zwak staat.
 *
 * Elke onderzoekskaart draagt al een bedrijfsonderdeel en een advies — dat veld
 * werd in V2 nergens gebruikt. Het oude portaal deed dit wel: een bevinding van
 * McKinsey of MIT werd advies voor het onderdeel waar hij over gaat.
 *
 * Alleen onderdelen waar de klant onder zijn streefniveau zit krijgen zo'n
 * advies. Een bevinding over een onderdeel dat al op orde is, is interessant
 * maar geen werk. En er komt geen bedrag bij: extern onderzoek zegt iets over de
 * markt, niet over wat het bij dit bedrijf oplevert. Wel staat erbij wat dit
 * onderdeel hier per jaar kost en welke afdelingen het raakt.
 */
function externOnderzoek(state) {
  const kosten = arr(calc('dimension-costs', state));
  if (!kosten.length) return [];
  const zwak = kosten.filter(d => d.niveau < d.streefniveau).slice(0, 3);
  const uit = [];
  for (const d of zwak) {
    const kaart = onderzoekVoor(d.id).find(item => item.advies);
    if (!kaart) continue;
    const raakt = doorwerking(d.id, state);
    uit.push(bevinding({
      id: `onderzoek-${d.id}`, soort: 'markt', dim: d.id,
      titel: kaart.advies,
      bewijs: `${kaart.t} — ${kaart.cijfer}. Bij jou staat ${d.label.toLowerCase()} op niveau ${d.niveau} van ${d.streefniveau} en kost ${Math.round(d.kosten).toLocaleString('nl-NL')} euro per jaar${raakt?.afdelingen.length ? `; het raakt ${raakt.afdelingen.join(', ')}` : ''}`,
      waarde: null, moeite: 'middel', duur: 6,
      bron: kaart.bron, pagina: 'onderzoek'
    }));
  }
  return uit;
}

/**
 * Financiële weerbaarheid. De waarde-en-financieringspagina rekende Altman Z,
 * schuldendekking en rentedekking al uit, maar die kwamen nergens terug als
 * werk. Een bedrijf dat op deze drie zakt, heeft een probleem dat voor alle
 * andere bevindingen uit gaat.
 */
function financieleWeerbaarheid(state) {
  if (!n(at(state, 'portal.valueFinance.balance'))) return [];
  const uit = [];
  const z = n(calc('altman-z', state));
  if (z && z < 3) uit.push(bevinding({
    id: 'altman-z', soort: 'kosten', dim: 'finance',
    titel: z < 1.8 ? 'De financiële weerbaarheid is kwetsbaar' : 'De financiële weerbaarheid zit in de grijze zone',
    bewijs: `Altman Z staat op ${z.toFixed(2)}; onder 1,8 geldt als kwetsbaar en boven 3 als stevig`,
    waarde: null, moeite: 'groot', duur: 12,
    bron: 'Eigen balans en resultaat', pagina: 'waarde-financiering'
  }));
  const dscr = n(calc('dscr', state));
  if (dscr && dscr < 1.25) uit.push(bevinding({
    id: 'dscr', soort: 'kosten', dim: 'finance',
    titel: 'De schuldendekking is krap',
    bewijs: `DSCR staat op ${dscr.toFixed(2)}; banken hanteren doorgaans 1,25 als ondergrens`,
    waarde: null, moeite: 'groot', duur: 12,
    bron: 'Eigen balans en resultaat', pagina: 'waarde-financiering'
  }));
  const rente = n(calc('interest-coverage', state));
  if (rente && rente < 3) uit.push(bevinding({
    id: 'rentedekking', soort: 'kosten', dim: 'finance',
    titel: 'De rentelasten drukken zwaar op het resultaat',
    bewijs: `De rentedekking is ${rente.toFixed(1)}x; onder 3x wordt het krap bij tegenvallers`,
    waarde: null, moeite: 'middel', duur: 8,
    bron: 'Eigen balans en resultaat', pagina: 'waarde-financiering'
  }));
  return uit;
}

/** Roadmap: wat staat er stil of heeft geen eigenaar? */
function roadmapStilstand(state) {
  const items = arr(at(state, 'portal.roadmap.items'));
  if (!items.length) return [];
  const zonderEigenaar = items.filter(item => !String(item.owner || '').trim() && item.done !== true);
  const stilstaand = items.filter(item => n(item.progress) === 0 && item.done !== true && String(item.owner || '').trim());
  const uit = [];
  if (zonderEigenaar.length) uit.push(bevinding({
    id: 'roadmap-zonder-eigenaar', soort: 'kans',
    titel: 'Roadmap-onderdelen hebben geen eigenaar',
    bewijs: `${zonderEigenaar.length} van de ${items.length} onderdelen heeft niemand die het trekt: ${zonderEigenaar.slice(0, 2).map(item => item.title).join(', ')}`,
    waarde: null, moeite: 'klein', duur: 1,
    bron: 'Eigen roadmap', pagina: 'roadmap'
  }));
  if (stilstaand.length) uit.push(bevinding({
    id: 'roadmap-stilstand', soort: 'kans',
    titel: 'Roadmap-onderdelen staan op nul procent',
    bewijs: `${stilstaand.length} onderdeel${stilstaand.length === 1 ? '' : 'en'} met een eigenaar maar zonder voortgang`,
    waarde: null, moeite: 'klein', duur: 2,
    bron: 'Eigen roadmap', pagina: 'roadmap'
  }));
  return uit;
}

/** Wijzigingen die zijn doorgevoerd maar niet geborgd, en offertes die wachten. */
function openBesluiten(state) {
  const uit = [];
  const wijzigingen = arr(at(state, 'portal.changes.items'));
  const nietGeborgd = wijzigingen.filter(item => item.status && item.status !== 'Geborgd');
  if (nietGeborgd.length) uit.push(bevinding({
    id: 'wijzigingen-niet-geborgd', soort: 'kans',
    titel: 'Doorgevoerde wijzigingen zijn nog niet geborgd',
    bewijs: `${nietGeborgd.length} van de ${wijzigingen.length} wijzigingen staat op ${[...new Set(nietGeborgd.map(item => item.status))].join(' of ')}; wat niet is vastgelegd, zakt terug`,
    waarde: null, moeite: 'klein', duur: 2,
    bron: 'Eigen wijzigingen', pagina: 'wijzigingen'
  }));
  const offerte = at(state, 'portal.offer') || {};
  if (offerte.package && offerte.approval?.agreed !== true) uit.push(bevinding({
    id: 'offerte-wacht', soort: 'kans',
    titel: 'De offerte wacht op akkoord',
    bewijs: `Pakket ${offerte.package}${n(offerte.sprints) ? ` van ${n(offerte.sprints)} sprints` : ''} ligt klaar, maar er is nog geen akkoord gegeven`,
    waarde: null, moeite: 'klein', duur: 1,
    bron: 'Eigen offerte', pagina: 'offerte'
  }));
  return uit;
}

/** Kansen uit de AI-scan die de klant zelf heeft ingevuld. */
function scanKansen(state) {
  const taken = arr(at(state, 'portal.aiScan.tasks'));
  if (!taken.length) return [];
  const baat = n(calc('risk-adjusted-benefit', state));
  return [bevinding({
    id: 'ai-scan-kansen', soort: 'kans',
    titel: 'Pak de kansen op die je in de AI-scan hebt opgeschreven',
    bewijs: `${taken.length} tak${taken.length === 1 ? '' : 'en'} in de scan${baat ? `, samen ${Math.round(baat).toLocaleString('nl-NL')} euro risicogewogen baat per jaar` : ', nog zonder doorgerekende baat'}`,
    waarde: baat || null, moeite: 'middel', duur: 6,
    bron: 'Eigen AI-scan', pagina: 'ai-scan'
  })];
}

const REGELS = [duursteOnderdelen, externOnderzoek, financieleWeerbaarheid, roadmapStilstand, openBesluiten, scanKansen, handmatigWerk, onderDeNorm, complianceGaten, passportGaten, businesscase];

/**
 * De volgorde. Waarde per jaar gedeeld door moeite is de basis; een harde datum
 * binnen een jaar tilt een bevinding omhoog, ook zonder bedrag. Bevindingen
 * zonder waarde én zonder datum staan onderaan — niet omdat ze onbelangrijk
 * zijn, maar omdat er geen grond is om ze hoger te zetten.
 */
function score(item, peil) {
  const basis = item.waarde ? item.waarde / MOEITE[item.moeite] : 0;
  let bonus = 0;
  if (item.datum) {
    const dagen = (new Date(item.datum) - new Date(peil)) / 864e5;
    if (dagen <= 365) bonus = 60000 - Math.max(0, dagen) * 100;
  }
  if (!item.waarde && item.soort === 'verplichting' && !item.datum) bonus += 5000;
  return basis + bonus;
}

/** Alle bevindingen, op volgorde van wat het oplevert. */
/**
 * Zonder eigen gegevens geen bevindingen. Anders zou het portaal bij een leeg
 * dossier melden dat "de brutomarge onder de norm ligt" op een marge van nul —
 * precies de soort bewering die in #1339 uit dit portaal is gehaald.
 */
function heeftEigenGegevens(state) {
  const omzet = n(at(state, 'portal.metrics.revenue'));
  const mensen = n(at(state, 'portal.profile.headcount'));
  const volwassenheid = Object.keys(at(state, 'portal.profile.maturity') || {}).length;
  const controls = arr(at(state, 'portal.compliance.controls')).length;
  return Boolean(omzet || mensen || volwassenheid || controls);
}

export function bevindingen(state = {}, peil = new Date().toISOString().slice(0, 10)) {
  if (!heeftEigenGegevens(state)) return [];
  const gevonden = REGELS.flatMap(regel => {
    try { return regel(state, peil); } catch { return []; }
  });
  return gevonden
    .map(item => ({ ...item, score: Math.round(score(item, peil)) }))
    .sort((a, b) => b.score - a.score || a.titel.localeCompare(b.titel));
}

/** Samenvatting: hoeveel, hoeveel waarde, en waar het zwaartepunt ligt. */
export function bevindingenSamenvatting(state = {}, peil = new Date().toISOString().slice(0, 10)) {
  const items = bevindingen(state, peil);
  const metWaarde = items.filter(item => item.waarde);
  const perSoort = {};
  for (const item of items) perSoort[item.soort] = (perSoort[item.soort] || 0) + 1;
  const geraakt = new Set(items.map(item => item.dim).filter(Boolean));
  return Object.freeze({
    dekking: PROFILE_DIMENSIONS.length ? Math.round(geraakt.size / PROFILE_DIMENSIONS.length * 100) : 0,
    geraakteOnderdelen: geraakt.size,
    totaal: items.length,
    metWaarde: metWaarde.length,
    zonderWaarde: items.length - metWaarde.length,
    waardePerJaar: metWaarde.reduce((sum, item) => sum + item.waarde, 0),
    perSoort: Object.freeze(perSoort),
    eerste: items[0] || null
  });
}

export const BEVINDINGEN_VERSION = '2026-09-11-v1';
