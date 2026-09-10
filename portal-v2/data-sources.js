import { HERKOMST, BRANCHENAMEN, ONDERZOEK, BRONNEN,
         onderzoekGeverifieerd, onderzoekTeVerifieren } from './external-data.js';
import { REGELGEVING, verlopenHerzieningen, achterhaaldeStatus, komendeMijlpalen } from './regelgeving.js';
import { parityCoverage } from './legacy-parity-engine.js';
import { BREIN_STAPPEN } from './runtime-evidence.js';

/**
 * Alle databronnen van het portaal op één plek.
 *
 * Het portaal wordt door vier soorten data gevoed, en die zaten in vier losse
 * modules zonder gedeeld beeld:
 *
 *   eigen      wat de klant zelf invult;
 *   runtime    de operating loop van het brein, met dertien stappen per lus;
 *   model      de rekenregels die van invoer een uitkomst maken;
 *   extern     branchenormen, onderzoek, het bronnenregister en de wetgeving.
 *
 * Dit bestand zet ze naast elkaar met dezelfde vragen: wat voedt het, hoeveel
 * zit erin, wanneer is het voor het laatst nagekeken, en is dat nog geldig.
 * Daarmee is in één oogopslag te zien waar de lus onderbroken is — een lege
 * runtime, een verlopen branchedataset of een wet die herzien moet worden zijn
 * alle drie een gat in hetzelfde geheel.
 */

const arr = value => (Array.isArray(value) ? value : []);
const at = (state, pad) => String(pad || '').split('.').filter(Boolean)
  .reduce((waarde, sleutel) => (waarde == null ? undefined : waarde[sleutel]), state);
const vandaag = () => new Date().toISOString().slice(0, 10);

export const SOORTEN = Object.freeze({
  eigen: 'Wat de klant zelf invult',
  runtime: 'Wat het brein meet',
  model: 'Wat het portaal uitrekent',
  extern: 'Wat de buitenwereld zegt'
});

/** Alle bronnen met hun stand op dit moment. */
export function dataBronnen(state = {}, peil = vandaag()) {
  const portal = at(state, 'portal') || {};
  const runtime = portal.runtime || {};
  const dekking = parityCoverage();
  const verlopenWet = verlopenHerzieningen(peil).length;
  const achterhaald = achterhaaldeStatus(peil).length;

  const ingevuld = Object.keys(portal).filter(sleutel =>
    !['runtime', 'admin', 'connectors'].includes(sleutel) &&
    portal[sleutel] && Object.keys(portal[sleutel]).length).length;

  const lussen = arr(runtime.brain?.items);
  const stappenOpOrde = lussen.filter(stap => stap.healthy).length;

  const bron = (id, soort, naam, aantal, eenheid, gezond, detail, meta = {}) =>
    Object.freeze({ id, soort, naam, aantal, eenheid, gezond, detail, ...meta });

  return Object.freeze([
    bron('klantinvoer', 'eigen', 'Ingevulde onderdelen', ingevuld, 'onderdelen', ingevuld > 0,
      ingevuld ? `${ingevuld} onderdelen bevatten gegevens` : 'Nog niets ingevuld; het portaal rekent daarom niets door'),

    bron('operating-loop', 'runtime', 'Operating loop van het brein',
      Number(runtime.brain?.loops) || 0, 'lussen', Number(runtime.brain?.loops) > 0,
      lussen.length
        ? `${stappenOpOrde} van de ${BREIN_STAPPEN.length} stappen rond over ${runtime.brain?.loops || 0} lussen`
        : 'Geen runtime-evidence; de Brein- en Powerhouse-pagina\'s blijven daarom leeg',
      { bijgewerkt: runtime.brain?.updatedAt || '' }),

    bron('koppelingen', 'runtime', 'Aangesloten bronsystemen',
      arr(runtime.sources?.items).length, 'systemen',
      arr(runtime.sources?.items).some(item => item.healthy),
      arr(runtime.sources?.items).length
        ? `${arr(runtime.sources?.items).filter(item => item.healthy).length} gezond, ${arr(runtime.sources?.items).filter(item => !item.healthy).length} vragen aandacht`
        : 'Geen integratiegezondheid opgehaald',
      { bijgewerkt: runtime.sources?.updatedAt || '' }),

    bron('rekenregels', 'model', 'Rekenregels in het pariteitscontract',
      dekking.total, 'berekeningen', dekking.missing.length === 0,
      dekking.missing.length
        ? `${dekking.missing.length} berekeningen ontbreken nog`
        : `Alle ${dekking.total} berekeningen zijn uitvoerbaar`),

    bron('branchenormen', 'extern', 'Branchenormen', BRANCHENAMEN.length, 'sectoren',
      HERKOMST.branches.herzienUiterlijk >= peil,
      `CBS, Eurostat, DNB en sectorprognoses · nagekeken ${HERKOMST.branches.peildatum}`,
      { peildatum: HERKOMST.branches.peildatum, herzienUiterlijk: HERKOMST.branches.herzienUiterlijk,
        voorbehoud: HERKOMST.branches.voorbehoud }),

    bron('onderzoek', 'extern', 'Onderzoeksbevindingen', ONDERZOEK.length, 'bevindingen',
      HERKOMST.onderzoek.herzienUiterlijk >= peil,
      `${onderzoekGeverifieerd().length} geverifieerd en gedateerd, ${onderzoekTeVerifieren().length} harde cijfers nog te dateren`,
      { peildatum: HERKOMST.onderzoek.peildatum, herzienUiterlijk: HERKOMST.onderzoek.herzienUiterlijk,
        voorbehoud: HERKOMST.onderzoek.voorbehoud }),

    bron('bronnenregister', 'extern', 'Bronnenregister', BRONNEN.length, 'vindplaatsen',
      HERKOMST.bronnen.herzienUiterlijk >= peil,
      'Elke vindplaats met URL, zodat een cijfer na te lopen is',
      { peildatum: HERKOMST.bronnen.peildatum, herzienUiterlijk: HERKOMST.bronnen.herzienUiterlijk,
        voorbehoud: HERKOMST.bronnen.voorbehoud }),

    bron('regelgeving', 'extern', 'Wet- en regelgeving', REGELGEVING.length, 'regels',
      verlopenWet === 0 && achterhaald === 0,
      verlopenWet || achterhaald
        ? `${verlopenWet} regels over hun herzieningsdatum, ${achterhaald} met een gepasseerde datum`
        : `Alle regels actueel · eerstvolgende wijziging ${komendeMijlpalen(peil, 24)[0]?.datum || 'onbekend'}`)
  ]);
}

/** Samenvatting over alle bronnen heen: is de lus rond? */
export function bronnenSamenvatting(state = {}, peil = vandaag()) {
  const bronnen = dataBronnen(state, peil);
  const gezond = bronnen.filter(item => item.gezond);
  const perSoort = {};
  for (const item of bronnen) perSoort[item.soort] = (perSoort[item.soort] || 0) + 1;
  return Object.freeze({
    totaal: bronnen.length,
    gezond: gezond.length,
    aandacht: bronnen.length - gezond.length,
    perSoort: Object.freeze(perSoort),
    onderbroken: Object.freeze(bronnen.filter(item => !item.gezond).map(item => item.naam)),
    volledig: gezond.length === bronnen.length
  });
}

/** Bronnen die aan herziening toe zijn, over alle soorten heen. */
export function bronnenTeHerzien(peil = vandaag()) {
  return dataBronnen({}, peil)
    .filter(item => item.herzienUiterlijk && item.herzienUiterlijk < peil)
    .map(item => ({ naam: item.naam, herzienUiterlijk: item.herzienUiterlijk }));
}

export const DATA_SOURCES_VERSION = '2026-09-10-v1';
