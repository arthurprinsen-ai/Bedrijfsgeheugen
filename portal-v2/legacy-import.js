import { upgradeLegacyPortalState } from './legacy-state-migration.js';

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

/**
 * De V1-export van klantportaal.html bevat de echte opgeslagen statefamilies.
 * Dezelfde migrator wordt gebruikt voor browserstate én back-ups; zo kan er
 * geen tweede, afwijkende vertaalwaarheid ontstaan.
 */
export const LEGACY_V1_EXPORT_KEYS=Object.freeze([
  'niveaus','medewerkers','uurkosten','taken','branche','omzet','mensen','cijfers','bc','eigen',
  'beleid','fin','modellen','uitvoering','kto','metingen','esg','eigenCaps','prod','beheer',
  'besluiten','docs','log','scanStempel','scanDatum','scanScore'
]);

/**
 * Zet een back-up van het oude portaal om met de canonieke, volledige
 * legacy-state-migrator. Onbekende velden blijven daarnaast ongewijzigd onder
 * portal.legacyImport.ruw staan, zodat nooit informatie stil verdwijnt.
 */
export function vertaalOudePortaalBackup(oudeState = {}) {
  const upgraded=upgradeLegacyPortalState(kopie(oudeState));
  const portal=isObject(upgraded?.portal)?kopie(upgraded.portal):{};
  const bekende=new Set(LEGACY_V1_EXPORT_KEYS);
  const aanwezig=LEGACY_V1_EXPORT_KEYS.filter(key=>oudeState[key]!==undefined);
  const onvertaald=Object.keys(oudeState)
    .filter(key=>!['versie','opgeslagen'].includes(key)&&!bekende.has(key));

  portal.legacyImport={
    bron:'klantportaal.html',
    versie:1,
    geexporteerd:oudeState.opgeslagen||'',
    vertaald:[...aanwezig].sort(),
    onvertaald:[...onvertaald].sort(),
    ruw:kopie(oudeState)
  };

  return {
    portal,
    sourceMeta:{label:'Geïmporteerde back-up van het oude klantportaal'}
  };
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

export const LEGACY_IMPORT_VERSION = '2026-09-18-v2';
