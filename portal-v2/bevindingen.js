import { calculateLegacyEquivalent as calc } from './legacy-parity-engine.js';
import { brancheVergelijking, brancheProfiel } from './external-data.js';
import { komendeMijlpalen } from './regelgeving.js';
import { beoordeelPortefeuille, rangschikRisicos, STATUS } from './compliance-engine.js';
import { bouwPassport } from './passport.js';
import { PROFILE_DIMENSIONS } from './modules/company-input.js';

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
  const rijen = brancheVergelijking({
    grossMargin: n(calc('gross-margin', state)), ebitdaMargin: n(calc('ebitda-margin', state)),
    wageRatio: n(calc('wage-ratio', state)), marketingRatio: n(calc('marketing-ratio', state)),
    itRatio: n(calc('it-ratio', state)), dso: n(calc('dso', state)),
    absence: n(at(state, 'portal.people.absence')), turnover: n(at(state, 'portal.people.turnover')),
    enps: n(at(state, 'portal.people.enps'))
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

const REGELS = [duursteOnderdelen, handmatigWerk, onderDeNorm, complianceGaten, passportGaten, businesscase];

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
