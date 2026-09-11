/**
 * Compliance-engine.
 *
 * Geport uit portal-next/compliance-engine.js, dat alleen in dat spoor zat.
 * Portal V2 had `compliance-state.js` met een eenvoudiger beoordeling; vier
 * dingen ontbraken daar, en die zijn hier de reden dat dit bestand meeverhuist:
 *
 *   1. Bewijs kan verlopen. Een control met een bewijsstuk waarvan `validUntil`
 *      in het verleden ligt, telt niet meer als geverifieerd. Zonder dat
 *      blijft een control voor altijd groen op een certificaat uit 2023.
 *   2. Dezelfde eis kan uit meerdere bronnen komen. Die worden ontdubbeld op
 *      framework plus id, waarbij de zwaarste beoordeling wint — anders telt
 *      één control twee keer mee in de dekking.
 *   3. NIS, WBNI, NIS2, CBW en Cyberbeveiligingswet zijn hetzelfde raamwerk
 *      onder verschillende namen. Ze worden samengenomen, anders lijkt de
 *      dekking per raamwerk hoger dan hij is.
 *   4. Risico's krijgen een rangorde op zwaarte, status, gekoppelde eisen en
 *      afhankelijkheden, zodat "wat eerst" een uitkomst is en geen mening.
 */

export const STATUS = Object.freeze({
  NOT_ASSESSED: 'NOT_ASSESSED',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  UNKNOWN: 'UNKNOWN',
  MISSING: 'MISSING',
  IN_PROGRESS: 'IN_PROGRESS',
  EVIDENCE_MISSING: 'EVIDENCE_MISSING',
  VERIFIED: 'VERIFIED'
});

export const STATUS_LABEL = Object.freeze({
  NOT_ASSESSED: 'Nog niet beoordeeld',
  NOT_APPLICABLE: 'Niet van toepassing',
  UNKNOWN: 'Onbekend',
  MISSING: 'Ontbreekt',
  IN_PROGRESS: 'In uitvoering',
  EVIDENCE_MISSING: 'Bewijs ontbreekt of is verlopen',
  VERIFIED: 'Geverifieerd'
});

const SAMENGEVOEGDE_RAAMWERKEN = new Set(['NIS', 'WBNI', 'NIS2', 'CBW', 'CYBERBEVEILIGINGSWET']);
const ZWAARTE = Object.freeze({ critical: 400, high: 300, medium: 200, low: 100, info: 0 });
const STATUS_GEWICHT = Object.freeze({
  MISSING: 300, EVIDENCE_MISSING: 250, IN_PROGRESS: 150,
  UNKNOWN: 120, NOT_ASSESSED: 120, VERIFIED: 0, NOT_APPLICABLE: -100
});

const lijst = value => (Array.isArray(value) ? value : []);

/** NIS, WBNI, NIS2, CBW en Cyberbeveiligingswet zijn hetzelfde raamwerk. */
export function canoniekRaamwerk(raamwerk = '') {
  const waarde = String(raamwerk || '').trim().toUpperCase();
  if (SAMENGEVOEGDE_RAAMWERKEN.has(waarde)) return 'NIS2_CBW';
  return waarde || 'ONBEKEND_RAAMWERK';
}

function geldigeDatum(value) {
  if (!value) return null;
  const datum = value instanceof Date ? value : new Date(value);
  return Number.isNaN(datum.getTime()) ? null : datum;
}

function bewijsIsGeldig(item, nu) {
  if (!item || item.verified === false) return false;
  const geldigTot = geldigeDatum(item.validUntil ?? item.geldigTot);
  if (geldigTot && geldigTot < nu) return false;
  return true;
}

function isIngericht(control) {
  if (!control) return false;
  if (typeof control === 'boolean') return control;
  if (typeof control === 'object' && 'implemented' in control) return control.implemented === true;
  return true;
}

/** Beoordeelt één control. De volgorde is bewust: niet van toepassing wint. */
export function beoordeelControl(control = {}, { nu = new Date() } = {}) {
  const basis = { ...control, framework: canoniekRaamwerk(control.framework) };
  const toepasbaar = String(control.applicability || 'unknown').toLowerCase();

  if (['not_applicable', 'not-applicable', 'n/a', 'niet_van_toepassing'].includes(toepasbaar))
    return { ...basis, status: STATUS.NOT_APPLICABLE };
  if (toepasbaar !== 'applicable' && toepasbaar !== 'van_toepassing')
    return { ...basis, status: STATUS.UNKNOWN };
  if (control.status === STATUS.IN_PROGRESS) return { ...basis, status: STATUS.IN_PROGRESS };
  if (!isIngericht(control.control)) return { ...basis, status: STATUS.MISSING };

  const geverifieerdOp = geldigeDatum(control.verifiedAt ?? control.geverifieerdOp);
  const bewijs = lijst(control.evidence ?? control.bewijs);
  const geldigBewijs = bewijs.some(item => bewijsIsGeldig(item, nu));
  if (!geverifieerdOp || geverifieerdOp > nu || !geldigBewijs)
    return { ...basis, status: STATUS.EVIDENCE_MISSING };

  return { ...basis, status: STATUS.VERIFIED };
}

/** Dezelfde eis uit twee bronnen telt één keer; de zwaarste beoordeling wint. */
function ontdubbel(controls, nu) {
  const perSleutel = new Map();
  for (const ruw of lijst(controls)) {
    const beoordeeld = beoordeelControl(ruw, { nu });
    const sleutel = `${beoordeeld.framework}:${beoordeeld.id || beoordeeld.requirement || ''}`;
    const bestaand = perSleutel.get(sleutel);
    if (!bestaand) { perSleutel.set(sleutel, beoordeeld); continue; }
    const oud = (ZWAARTE[bestaand.severity] || 0) + (STATUS_GEWICHT[bestaand.status] || 0);
    const nieuw = (ZWAARTE[beoordeeld.severity] || 0) + (STATUS_GEWICHT[beoordeeld.status] || 0);
    if (nieuw > oud) perSleutel.set(sleutel, beoordeeld);
  }
  return [...perSleutel.values()];
}

function perRaamwerk(controls) {
  const raamwerken = {};
  for (const control of controls) {
    const bak = raamwerken[control.framework] ||= {
      totaal: 0, geverifieerd: 0, ontbreekt: 0, onbekend: 0, bewijsOntbreekt: 0, inUitvoering: 0, nietVanToepassing: 0
    };
    bak.totaal += 1;
    if (control.status === STATUS.VERIFIED) bak.geverifieerd += 1;
    else if (control.status === STATUS.MISSING) bak.ontbreekt += 1;
    else if (control.status === STATUS.UNKNOWN || control.status === STATUS.NOT_ASSESSED) bak.onbekend += 1;
    else if (control.status === STATUS.EVIDENCE_MISSING) bak.bewijsOntbreekt += 1;
    else if (control.status === STATUS.IN_PROGRESS) bak.inUitvoering += 1;
    else if (control.status === STATUS.NOT_APPLICABLE) bak.nietVanToepassing += 1;
  }
  for (const bak of Object.values(raamwerken)) {
    const beoordeeld = bak.totaal - bak.nietVanToepassing - bak.onbekend;
    bak.beoordeeld = beoordeeld;
    bak.dekking = beoordeeld > 0 ? Math.round(bak.geverifieerd / beoordeeld * 100) : null;
  }
  return raamwerken;
}

/** De hele portefeuille. Dekking telt alleen wat beoordeeld én van toepassing is. */
export function beoordeelPortefeuille(controls = [], { nu = new Date(), scope = 'klant' } = {}) {
  const beoordeeld = ontdubbel(controls, nu);
  const onbekend = beoordeeld.filter(item => item.status === STATUS.UNKNOWN || item.status === STATUS.NOT_ASSESSED).length;
  const toepasbaar = beoordeeld.filter(item =>
    ![STATUS.NOT_APPLICABLE, STATUS.UNKNOWN, STATUS.NOT_ASSESSED].includes(item.status));
  const geverifieerd = toepasbaar.filter(item => item.status === STATUS.VERIFIED).length;
  return Object.freeze({
    scope, controls: beoordeeld, raamwerken: perRaamwerk(beoordeeld),
    totaal: beoordeeld.length, onbekend, toepasbaar: toepasbaar.length, geverifieerd,
    dekking: toepasbaar.length ? Math.round(geverifieerd / toepasbaar.length * 100) : null
  });
}

/** Wat eerst: een uitkomst van zwaarte, status, gekoppelde eisen en afhankelijkheden. */
export function rangschikRisicos(controls = [], { nu = new Date() } = {}) {
  return ontdubbel(controls, nu)
    .filter(item => ![STATUS.VERIFIED, STATUS.NOT_APPLICABLE].includes(item.status))
    .map(item => {
      const eisen = lijst(item.linkedRequirements).length;
      const afhankelijk = lijst(item.dependencies).length * 4;
      const score = (ZWAARTE[item.severity] || ZWAARTE.medium)
        + (STATUS_GEWICHT[item.status] || 0) + Math.min(eisen * 3, 30) + afhankelijk;
      return { ...item, risicoScore: score };
    })
    .sort((a, b) => b.risicoScore - a.risicoScore || String(a.id).localeCompare(String(b.id)));
}

/** Momentopname voor een audit: portefeuille, bevindingen en bewijsindex. */
export function auditMomentopname(controls = [], { nu = new Date(), scope = 'klant', publiek = 'audit' } = {}) {
  const portefeuille = beoordeelPortefeuille(controls, { nu, scope });
  const bevindingen = rangschikRisicos(portefeuille.controls, { nu }).map(item => ({
    id: item.id, raamwerk: item.framework, eis: item.requirement, status: item.status,
    zwaarte: item.severity, eigenaar: item.owner || null, reden: item.reason || null,
    volgendeActie: item.nextAction || null, risicoScore: item.risicoScore
  }));
  const bewijsindex = portefeuille.controls.flatMap(control => lijst(control.evidence).map(bewijs => ({
    controlId: control.id, raamwerk: control.framework, bewijsId: bewijs.id || null,
    label: bewijs.label || bewijs.type || 'Bewijs', bron: bewijs.source || bewijs.href || null,
    geldigTot: bewijs.validUntil || null
  })));
  return Object.freeze({
    scope, publiek, tijdstip: nu.toISOString(), raamwerken: portefeuille.raamwerken,
    samenvatting: {
      totaal: portefeuille.totaal, toepasbaar: portefeuille.toepasbaar,
      geverifieerd: portefeuille.geverifieerd, onbekend: portefeuille.onbekend, dekking: portefeuille.dekking
    },
    bevindingen, bewijsindex
  });
}

export const COMPLIANCE_ENGINE_VERSION = '2026-09-10-v1';
