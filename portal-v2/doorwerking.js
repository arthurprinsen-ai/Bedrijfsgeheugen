import { CAPABILITIES } from './capability-catalog.js';
import { PROFILE_DIMENSIONS } from './modules/company-input.js';
import { calculateLegacyEquivalent as calc } from './legacy-parity-engine.js';

/**
 * Doorwerking en rekenwijze.
 *
 * Twee dingen die het oude klantportaal had en Portal V2 niet, en die allebei
 * over hetzelfde gaan: laten zien dat een keuze gevolgen heeft en dat een bedrag
 * na te rekenen is.
 *
 *   doorwerking  Geport uit `doorwerking()` en `toonDoorwerking()`. Kies een
 *                bedrijfsonderdeel en zie welke capabilities daar spelen, welke
 *                afdelingen dat raakt, en wat per afdeling de eerste stap is.
 *                Die stappen zijn om te zetten in taken, zodat een inzicht niet
 *                op een scherm blijft staan.
 *
 *   rekenwijze   Geport uit `tekenRekenwijze()`. Het oude portaal zei het zelf
 *                het beste: geen zwarte doos, je kunt ze narekenen. Portal V2
 *                rekende 104 getallen uit zonder ergens te tonen hóe. Hier staat
 *                per berekening de formule, de ingevulde waarden en de uitkomst.
 */

const arr = value => (Array.isArray(value) ? value : []);
const at = (state, pad) => String(pad || '').split('.').filter(Boolean)
  .reduce((waarde, sleutel) => (waarde == null ? undefined : waarde[sleutel]), state);
const n = value => (Number.isFinite(Number(value)) ? Number(value) : 0);
const euro = value => `€ ${Math.round(n(value)).toLocaleString('nl-NL')}`;

/* ---------- doorwerking ---------- */

/**
 * Wat raakt dit bedrijfsonderdeel? Capabilities, afdelingen, en per afdeling
 * de concrete eerste stappen. Een capability zonder eigen project levert een
 * stap op die eerlijk zegt dat hij nog bepaald moet worden — beter dan niets
 * tonen en beter dan iets verzinnen.
 */
export function doorwerking(dimensionId, state = {}) {
  const onderdeel = PROFILE_DIMENSIONS.find(d => d.id === dimensionId);
  if (!onderdeel) return null;

  const eigen = at(state, 'portal.ownCapabilities') || {};
  const ids = Object.entries(CAPABILITIES)
    .filter(([, cap]) => cap.dim === dimensionId).map(([id]) => id)
    .concat(Object.entries(eigen).filter(([, cap]) => cap?.dim === dimensionId).map(([id]) => id));

  const perAfdeling = {};
  for (const id of ids) {
    const cap = CAPABILITIES[id] || eigen[id];
    if (!cap) continue;
    for (const afdeling of (arr(cap.afd).length ? arr(cap.afd) : ['Nog te bepalen'])) {
      const stappen = perAfdeling[afdeling] ||= [];
      const projecten = arr(cap.proj).length ? arr(cap.proj) : [`Eerste stap bepalen voor ${cap.n}`];
      for (const project of projecten) if (!stappen.includes(project)) stappen.push(project);
    }
  }

  const niveau = n(at(state, `portal.profile.maturity.${dimensionId}`));
  const kosten = arr(calc('dimension-costs', state)).find(d => d.id === dimensionId) || null;

  return Object.freeze({
    onderdeel: onderdeel.label, dimensionId, niveau: niveau || null,
    capabilities: ids.map(id => (CAPABILITIES[id] || eigen[id]).n),
    afdelingen: Object.keys(perAfdeling).sort(),
    perAfdeling: Object.freeze(perAfdeling),
    stappen: Object.values(perAfdeling).flat().length,
    kostenPerJaar: kosten ? Math.round(kosten.kosten) : null,
    teWinnen: kosten ? Math.round(kosten.potentieel) : null
  });
}

/**
 * De stappen als taken, klaar om weg te schrijven. Schrijft zelf niets: het
 * scherm beslist wanneer, en een bestaande taak wordt niet gedupliceerd.
 */
export function doorwerkingAlsTaken(dimensionId, state = {}, { perAfdeling: maximum = 3, wanneer = null } = {}) {
  const d = doorwerking(dimensionId, state);
  if (!d) return [];
  const bestaand = new Set(arr(at(state, 'portal.tasks.items'))
    .map(taak => `${taak.department || ''}::${taak.title || ''}`));
  const datum = wanneer || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const taken = [];
  for (const afdeling of d.afdelingen) {
    for (const stap of d.perAfdeling[afdeling].slice(0, maximum)) {
      if (bestaand.has(`${afdeling}::${stap}`)) continue;
      taken.push({ title: stap, department: afdeling, owner: '', due: datum, status: 'Open', dim: dimensionId });
    }
  }
  return taken;
}

/**
 * Alle onderdelen met hun doorwerking, duurste eerst.
 *
 * Alleen onderdelen waar de klant een volwassenheidsniveau voor heeft ingevuld.
 * De capabilitykast bestaat los van de klant, dus zonder die grens zou dit
 * overzicht ook bij een leeg dossier elf onderdelen tonen — een lijst die
 * nergens op slaat.
 */
export function doorwerkingOverzicht(state = {}) {
  const niveaus = at(state, 'portal.profile.maturity') || {};
  return PROFILE_DIMENSIONS
    .filter(d => n(niveaus[d.id]) >= 1)
    .map(d => doorwerking(d.id, state))
    .filter(d => d && d.stappen > 0)
    .sort((a, b) => (b.kostenPerJaar || 0) - (a.kostenPerJaar || 0));
}

/* ---------- rekenwijze ---------- */

/**
 * Hoe dit portaal rekent. Per berekening de formule, de waarden die de klant
 * heeft ingevuld en de uitkomst. Zonder ingevulde waarden geen uitkomst: dan
 * staat er wat er nodig is, niet een nul die iets lijkt te betekenen.
 */
export function rekenwijze(state = {}) {
  const profiel = at(state, 'portal.profile') || {};
  const cijfers = at(state, 'portal.metrics') || {};
  const kosten = arr(calc('dimension-costs', state));
  const duurste = kosten[0] || null;

  const regel = ({ id, titel, formule, invoer, uitkomst, nodig, uitleg }) => Object.freeze({
    id, titel, formule, invoer, uitleg,
    uitkomst: uitkomst ?? null,
    compleet: Boolean(uitkomst != null),
    nodig: uitkomst != null ? [] : nodig
  });

  return Object.freeze([
    regel({
      id: 'handwerk-per-onderdeel', titel: 'Handwerk per bedrijfsonderdeel',
      formule: 'uren per week × factor(niveau) × (medewerkers ÷ 24) × 46 weken × uurkosten',
      uitleg: 'Elk onderdeel heeft een basisaantal uren. Hoe hoger het volwassenheidsniveau, hoe minder daarvan blijft hangen: op niveau 1 alles, op niveau 5 nog zes procent.',
      invoer: duurste
        ? `${duurste.label}: ${duurste.uren} uur × factor(niveau ${duurste.niveau}) × (${n(profiel.headcount)} ÷ 24) × 46 × ${euro(profiel.hourlyCost)}`
        : null,
      uitkomst: duurste ? euro(duurste.kosten) : null,
      nodig: ['volwassenheid per onderdeel', 'aantal medewerkers', 'uurkosten']
    }),
    regel({
      id: 'handmatig-werk', titel: 'Handmatig werk per jaar',
      formule: 'uren handmatig werk per week × 46 weken × uurkosten',
      uitleg: 'Het losse handwerk dat je zelf hebt opgegeven, buiten de onderdelen om.',
      invoer: n(profiel.manualHoursPerWeek) && n(profiel.hourlyCost)
        ? `${n(profiel.manualHoursPerWeek)} uur × 46 × ${euro(profiel.hourlyCost)}` : null,
      uitkomst: n(calc('manual-work-annual', state)) ? euro(calc('manual-work-annual', state)) : null,
      nodig: ['uren handmatig werk per week', 'uurkosten']
    }),
    regel({
      id: 'ebitda-marge', titel: 'EBITDA-marge',
      formule: 'EBITDA ÷ omzet × 100',
      uitleg: 'De marge waarmee je tegen de branchenorm wordt gelegd.',
      invoer: n(cijfers.ebitda) && n(cijfers.revenue)
        ? `${euro(cijfers.ebitda)} ÷ ${euro(cijfers.revenue)} × 100` : null,
      uitkomst: n(cijfers.revenue) ? `${n(calc('ebitda-margin', state)).toFixed(1)}%` : null,
      nodig: ['omzet', 'EBITDA']
    }),
    regel({
      id: 'ondernemingswaarde', titel: 'Ondernemingswaarde',
      formule: 'EBITDA × multiple − schuld + kas',
      uitleg: 'De multiple komt uit de financiële kengetallen van je branche, of uit je eigen invoer.',
      invoer: n(cijfers.ebitda)
        ? `${euro(cijfers.ebitda)} × ${n(at(state, 'portal.valueFinance.multiple'))} − ${euro(at(state, 'portal.valueFinance.debt'))} + ${euro(at(state, 'portal.valueFinance.cash'))}` : null,
      uitkomst: n(cijfers.ebitda) ? euro(calc('equity-value', state)) : null,
      nodig: ['EBITDA', 'multiple', 'schuld en kas']
    }),
    regel({
      id: 'terugverdientijd', titel: 'Terugverdientijd',
      formule: 'investering ÷ (risicogewogen baat ÷ 12)',
      uitleg: 'In maanden, op basis van de baat die je zelf hebt doorgerekend.',
      invoer: n(calc('risk-adjusted-benefit', state))
        ? `${euro(at(state, 'portal.businessCase.investment'))} ÷ (${euro(calc('risk-adjusted-benefit', state))} ÷ 12)` : null,
      uitkomst: n(calc('payback', state)) ? `${n(calc('payback', state)).toFixed(1)} maanden` : null,
      nodig: ['investering', 'taken met tijdwinst in de AI-scan']
    }),
    regel({
      id: 'branchevergelijking', titel: 'Vergelijking met je branche',
      formule: 'eigen cijfer − norm van je sector',
      uitleg: 'De normen komen uit CBS, Eurostat, DNB en sectorprognoses. Per maatstaf weet het portaal of hoger of juist lager beter is.',
      invoer: at(state, 'portal.market.industry') ? `Sector: ${at(state, 'portal.market.industry')}` : null,
      uitkomst: at(state, 'portal.market.industry') ? 'Zie de bevindingen op Advies' : null,
      nodig: ['branche', 'eigen cijfers']
    })
  ]);
}

/** Hoeveel van de rekenwijze is met eigen gegevens ingevuld? */
export function rekenwijzeDekking(state = {}) {
  const regels = rekenwijze(state);
  const compleet = regels.filter(regel => regel.compleet).length;
  return Object.freeze({
    totaal: regels.length, compleet, open: regels.length - compleet,
    percentage: Math.round(compleet / regels.length * 100)
  });
}

export const DOORWERKING_VERSION = '2026-09-11-v1';
