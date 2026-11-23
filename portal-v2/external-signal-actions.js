import { PORTAL_PAGE_INDEX } from './page-registry.js';
import { bevindingen } from './bevindingen.js';
import { regulatoryContextTrace } from './regulatory-context-trace.js';

/**
 * Van extern signaal naar actie, op de pagina waar het ertoe doet.
 *
 * Wat dit is
 * ----------
 * Een brug, geen nieuw scoremodel. De volgorde en weging van externe signalen
 * (branchenormen, onderzoek, regelgeving met een datum) bestaan al in
 * bevindingen.js: waarde per jaar gedeeld door moeite, met een harde datum die
 * een bevinding omhoog tilt. De Company Decision Engine blijft de enige bron
 * van Now/Next/Later/Don't. Dit bestand neemt de uitkomst van bevindingen.js
 * over als contextuele actiekaart, zodat dezelfde bevinding verschijnt op elke
 * pagina die erdoor geraakt wordt, met bron, peildatum en reden erbij.
 *
 * Wat dit niet is
 * ---------------
 * Geen juridisch oordeel, geen gemeten risico en geen gerealiseerde besparing.
 * P1/P2/P3 is dezelfde aandachtsindeling als bij de andere kaarten:
 *   P1  harde datum binnen 90 dagen, of al verstreken
 *   P2  harde datum binnen een jaar, of een bevinding met een bedrag per jaar
 *   P3  de rest
 * Rust een signaal op een bron die over zijn herzieningsdatum is, dan zakt het
 * één niveau en staat dat erbij. Een verouderd cijfer mag aandacht trekken,
 * maar niet bovenaan staan.
 */

const unique = values => [...new Set(values)];
const valid = pages => unique(pages).filter(page => Boolean(PORTAL_PAGE_INDEX[page]));
const DAG = 864e5;

const NORM_PAGES = ['branche-markt', 'omgevingsradar', 'advies', 'roadmap', 'taken-werkstromen', 'overzicht'];
const ONDERZOEK_PAGES = ['onderzoek', 'branche-markt', 'omgevingsradar', 'advies', 'roadmap', 'overzicht'];

/** Aandachtsniveau uit de harde datum en het bedrag; één niveau lager bij een verouderde bron. */
export function externalSignalPriority(item = {}, peil) {
  let niveau = 3;
  if (item.datum) {
    const dagen = Math.round((new Date(item.datum) - new Date(peil)) / DAG);
    if (dagen <= 90) niveau = 1;
    else if (dagen <= 365) niveau = 2;
  }
  if (niveau === 3 && Number(item.waarde) > 0) niveau = 2;
  if (item.extern?.verouderd) niveau = Math.min(3, niveau + 1);
  return 'P' + niveau;
}

/**
 * Eén bevinding met externe herkomst wordt één kaart. Bevindingen zonder
 * `extern` (eigen controls, eigen roadmap, eigen businesscase) horen hier niet:
 * die staan al op hun eigen pagina's.
 */
function pagesFor(item, trace) {
  if (trace) return valid([...trace.affectedPages, item.pagina]);
  if (item.extern?.dataset === 'onderzoek') return valid([item.pagina, ...ONDERZOEK_PAGES]);
  return valid([item.pagina, ...NORM_PAGES]);
}

export function appendExternalSignalActions(state = {}, cards = [], { card, item, today } = {}) {
  const peil = today || new Date().toISOString().slice(0, 10);
  for (const signal of bevindingen(state, peil)) {
    if (!signal.extern) continue;
    const isRegel = signal.extern.dataset === 'regelgeving';
    const trace = isRegel
      ? regulatoryContextTrace({
        id: signal.extern.regelId, title: signal.titel, framework: signal.extern.categorie,
        sourceUrl: signal.extern.url, effectiveDate: signal.datum
      })
      : null;
    const pages = pagesFor(signal, trace);
    if (!pages.length) continue;
    const verouderd = signal.extern.verouderd === true;
    const entry = card(
      'extern-' + signal.id.replace(/[^a-z0-9-]/gi, '-').slice(0, 64),
      signal.titel,
      externalSignalPriority(signal, peil),
      'portal.external.signal',
      signal.id,
      signal.bewijs + '. Dit is een afgeleid signaal uit externe data, geen vastgesteld risico.',
      isRegel
        ? 'Toets of dit voor jouw organisatie geldt, wie eigenaar is en wat er vóór de datum moet gebeuren. Leg de uitkomst vast.'
        : 'Zoek de oorzaak van de afwijking, kies een eigenaar en een meetmoment, en vergelijk daarna opnieuw met de norm.',
      pages,
      {
        ...(trace ? { regulatoryImpact: trace, regulatorySource: trace.sourceUrl, regulatoryEvidenceStatus: 'SOURCE_REVIEW_REQUIRED' } : {}),
        externalBasis: Object.freeze({
          bron: signal.bron,
          dataset: signal.extern.dataset,
          peildatum: signal.extern.peildatum,
          herzienUiterlijk: signal.extern.herzienUiterlijk,
          verouderd,
          datum: signal.datum || null,
          reden: signal.reden,
          rangschikking: signal.score
        }),
        ...(Number(signal.waarde) > 0 ? {
          financialImpact: Object.freeze({
            status: 'SCENARIO_ONLY', amount: Number(signal.waarde), unit: 'EUR_PER_YEAR',
            label: 'Indicatief per jaar: eigen cijfers tegenover de branchenorm',
            reason: 'Afgeleid uit de eigen invoer en een externe norm; geen gerealiseerde besparing of kasstroom.'
          })
        } : {})
      }
    );
    item(cards, entry);
  }
}

/**
 * Een rij uit `bg_externe_signalen` (Tavily, met vertrouwen en deadline) als
 * regelgevingssignaal dat de bestaande kaartenketen al kent
 * (`portal.external.regulatoryEvents`). Alleen toegestane rijen met voldoende
 * vertrouwen en een geldige deadline. Het signaal is nooit tenant-geverifieerd:
 * de toepasselijkheid blijft een menselijke beoordeling.
 *
 * Deze functie is de adapter; wat de rijen in de klantstatus zet is een aparte
 * server-stap, en die bestaat nog niet.
 */
export function externalSignalRowToEvent(row = {}) {
  if (row.toegestaan !== true) return null;
  if (!(Number(row.vertrouwen) >= 0.6)) return null;
  const deadline = String(row.deadline || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  if (!/^https:\/\//.test(String(row.url || ''))) return null;
  return Object.freeze({
    id: 'signaal-' + String(row.url).replace(/^https:\/\//, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 48),
    title: String(row.titel || row.onderwerp || 'Extern signaal'),
    framework: String(row.onderwerp || row.domein || ''),
    sourceUrl: row.url,
    effectiveDate: deadline,
    authority: 'external-signal-search',
    tenantScoped: false,
    evidenceStatus: 'UNVERIFIED',
    confidence: Number(row.vertrouwen),
    publishedAt: row.gepubliceerd_op || null
  });
}
