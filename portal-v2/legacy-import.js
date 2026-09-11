import { PROFILE_DIMENSIONS } from './modules/company-input.js';

/**
 * Back-ups van het oude klantportaal inlezen in Portal V2.
 *
 * Geport uit portal/import-state.mjs, dat alleen in het oude portal-spoor zat.
 * Portal V2 kon een export van klantportaal.html niet openen: stagePortalImport
 * accepteerde alleen version 4 en version 2, en gaf op alles daarvoor
 * UNSUPPORTED_PORTAL_BACKUP. Een klant met een oude back-up kon zijn gegevens
 * dus niet meenemen.
 *
 * Het oude formaat is `{versie:1, opgeslagen, niveaus, mw, uur, taken, ...}` —
 * de sleutels komen uit `exporteer()` in klantportaal.html.
 *
 * Wat deze vertaling wel en niet doet
 * -----------------------------------
 * Alleen velden waarvan de betekenis eenduidig is worden gemapt. Alles wat
 * overblijft gaat ongewijzigd mee in `portal.legacyImport.ruw`, zodat er niets
 * stilzwijgend verdwijnt en een latere vertaling nog mogelijk is. Gokken naar
 * welke v2-slice een oud veld hoort zou erger zijn dan het onvertaald laten:
 * dan staat er een getal op een scherm dat niet betekent wat het zegt.
 */

const arr = value => (Array.isArray(value) ? value : []);
const isObject = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const getal = value => (Number.isFinite(Number(value)) ? Number(value) : null);
const kopie = value => (value == null ? value : JSON.parse(JSON.stringify(value)));

/** Herkent het formaat van een back-up zonder hem al te vertalen. */
export function herkenBackup(raw) {
  let parsed;
  try { parsed = JSON.parse(String(raw ?? '')); } catch { throw new Error('INVALID_JSON'); }
  if (!isObject(parsed)) throw new Error('UNSUPPORTED_PORTAL_BACKUP');
  if (Number(parsed.version) === 4 && isObject(parsed.state))
    return Object.freeze({ soort: 'canonical-v4', versie: 4, geexporteerd: parsed.exportedAt || '', state: kopie(parsed.state) });
  if (Number(parsed.version) === 2 && isObject(parsed.storage))
    return Object.freeze({ soort: 'portal-v2-storage-v2', versie: 2, geexporteerd: parsed.exportedAt || '', storage: kopie(parsed.storage) });
  const oud = Number(parsed.versie) === 1
    && (isObject(parsed.niveaus) || arr(parsed.taken).length || arr(parsed.besluiten).length || arr(parsed.docs).length);
  if (oud)
    return Object.freeze({ soort: 'klantportaal-v1', versie: 1, geexporteerd: parsed.opgeslagen || '', oudeState: kopie(parsed) });
  throw new Error('UNSUPPORTED_PORTAL_BACKUP');
}

/** De velden die eenduidig te vertalen zijn, met hun bestemming in v2. */
const VERTALING = Object.freeze([
  ['mw', 'portal.profile.headcount', getal],
  ['uur', 'portal.profile.hourlyCost', getal],
  ['branche', 'portal.market.industry', value => String(value || '') || null],
  ['omzet', 'portal.metrics.revenue', getal],
  ['taken', 'portal.tasks.items', value => arr(value).map(item => ({
    title: String(item?.wat || item?.titel || item?.title || ''),
    owner: String(item?.wie || item?.owner || ''),
    due: item?.wanneer || item?.due || '',
    status: String(item?.status || 'Open')
  })).filter(item => item.title)],
  ['besluiten', 'portal.changes.items', value => arr(value).map(item => ({
    change: String(item?.wat || item?.besluit || ''),
    area: String(item?.onderdeel || item?.area || ''),
    reason: String(item?.waarom || ''),
    owner: String(item?.wie || ''),
    status: String(item?.status || 'Geborgd')
  })).filter(item => item.change)]
]);

function zet(doel, pad, waarde) {
  if (waarde == null || (Array.isArray(waarde) && !waarde.length)) return false;
  const delen = pad.split('.');
  let node = doel;
  for (const sleutel of delen.slice(0, -1)) {
    if (!isObject(node[sleutel])) node[sleutel] = {};
    node = node[sleutel];
  }
  node[delen.at(-1)] = waarde;
  return true;
}

/**
 * Zet een back-up van het oude portaal om in een v2-state.
 * Geeft naast de state een verslag terug van wat is vertaald en wat niet,
 * zodat het scherm dat eerlijk kan tonen in plaats van te doen alsof alles mee is.
 */
export function vertaalOudePortaalBackup(oudeState = {}) {
  const state = { portal: {} };
  const vertaald = [];

  for (const [sleutel, pad, omzetten] of VERTALING) {
    if (oudeState[sleutel] === undefined) continue;
    if (zet(state, pad, omzetten(oudeState[sleutel]))) vertaald.push(sleutel);
  }

  // De volwassenheidsniveaus zijn per bedrijfsonderdeel opgeslagen onder dezelfde
  // sleutels die v2 nog steeds gebruikt; alleen bekende onderdelen gaan mee.
  const bekend = new Set(PROFILE_DIMENSIONS.map(dimensie => dimensie.id));
  const niveaus = isObject(oudeState.niveaus) ? oudeState.niveaus : {};
  const maturity = {};
  for (const [sleutel, waarde] of Object.entries(niveaus)) {
    const niveau = getal(waarde);
    if (bekend.has(sleutel) && niveau !== null) maturity[sleutel] = niveau;
  }
  if (Object.keys(maturity).length) { zet(state, 'portal.profile.maturity', maturity); vertaald.push('niveaus'); }

  const onvertaald = Object.keys(oudeState)
    .filter(sleutel => !['versie', 'opgeslagen'].includes(sleutel) && !vertaald.includes(sleutel));

  state.portal.legacyImport = {
    bron: 'klantportaal.html',
    versie: 1,
    geexporteerd: oudeState.opgeslagen || '',
    vertaald: [...vertaald].sort(),
    onvertaald: [...onvertaald].sort(),
    ruw: kopie(oudeState)
  };
  state.sourceMeta = { label: 'Geïmporteerde back-up van het oude klantportaal' };
  return state;
}

/** Wat verandert er als je deze back-up toepast? Zonder iets te schrijven. */
export function voorbeeldVanImport(huidig = {}, nieuw = {}) {
  const tel = (state, pad) => arr(pad.split('.').reduce((n, k) => (n == null ? undefined : n[k]), state)).length;
  const naam = state => String(state?.portal?.company?.name || state?.company?.name || '');
  return Object.freeze({
    bedrijfWijzigt: naam(huidig) !== naam(nieuw),
    huidigBedrijf: naam(huidig),
    nieuwBedrijf: naam(nieuw),
    takenDelta: tel(nieuw, 'portal.tasks.items') - tel(huidig, 'portal.tasks.items'),
    wijzigingenDelta: tel(nieuw, 'portal.changes.items') - tel(huidig, 'portal.changes.items'),
    roadmapDelta: tel(nieuw, 'portal.roadmap.items') - tel(huidig, 'portal.roadmap.items'),
    vertaald: arr(nieuw?.portal?.legacyImport?.vertaald).length,
    onvertaald: arr(nieuw?.portal?.legacyImport?.onvertaald).length
  });
}

export const LEGACY_IMPORT_VERSION = '2026-09-10-v1';
