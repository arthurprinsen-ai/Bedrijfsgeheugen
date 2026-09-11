import test from 'node:test';
import assert from 'node:assert/strict';
import { herkenBackup, vertaalOudePortaalBackup, voorbeeldVanImport } from '../legacy-import.js';
import { stagePortalImport } from '../portal-actions.js';

/**
 * Portal V2 kon een export van het oude klantportaal niet openen.
 * stagePortalImport accepteerde alleen version 4 en version 2 en gaf op alles
 * daarvoor UNSUPPORTED_PORTAL_BACKUP. Een klant met een oude back-up kon zijn
 * gegevens dus niet meenemen — en dat was een van de redenen dat het oude
 * portal-spoor niet weg kon.
 *
 * De regel die deze test bewaakt: er verdwijnt niets stilzwijgend. Alleen velden
 * met een eenduidige betekenis worden vertaald; al het andere gaat ongewijzigd
 * mee en wordt als onvertaald gemeld. Gokken naar welke v2-slice een oud veld
 * hoort zou erger zijn dan het onvertaald laten: dan staat er een getal op een
 * scherm dat niet betekent wat het zegt.
 */

const OUDE_BACKUP = {
  versie: 1, opgeslagen: '2026-03-01T10:00:00Z',
  niveaus: { commercie: 4, operatie: 2, bestaatniet: 5 },
  mw: 38, uur: 52, branche: 'ICT & software', omzet: 2400000,
  taken: [{ wat: 'Klantdata opschonen', wie: 'Sam', wanneer: '2026-04-01', status: 'Open' }, { wat: '' }],
  besluiten: [{ wat: 'Overstappen op Supabase', onderdeel: 'tech', waarom: 'Eén bron', wie: 'Arthur' }],
  docs: [{ naam: 'RIE.pdf' }], log: [{ t: 'x' }], esg: { a: 1 }, scanScore: 72
};

const bestand = inhoud => ({ name: 'backup.json', text: async () => JSON.stringify(inhoud) });

test('de drie ondersteunde formaten worden herkend', () => {
  assert.equal(herkenBackup(JSON.stringify(OUDE_BACKUP)).soort, 'klantportaal-v1');
  assert.equal(herkenBackup(JSON.stringify({ version: 4, state: { a: 1 } })).soort, 'canonical-v4');
  assert.equal(herkenBackup(JSON.stringify({ version: 2, storage: {} })).soort, 'portal-v2-storage-v2');
});

test('een onbruikbare back-up wordt geweigerd in plaats van half ingelezen', () => {
  assert.throws(() => herkenBackup('geen json'), /INVALID_JSON/);
  assert.throws(() => herkenBackup('[]'), /UNSUPPORTED_PORTAL_BACKUP/);
  assert.throws(() => herkenBackup(JSON.stringify({ versie: 9 })), /UNSUPPORTED_PORTAL_BACKUP/);
  assert.throws(() => herkenBackup(JSON.stringify({ versie: 1 })), /UNSUPPORTED_PORTAL_BACKUP/,
    'een lege back-up zonder inhoud hoort niet als oude back-up te gelden');
});

test('alleen eenduidige velden worden vertaald', () => {
  const state = vertaalOudePortaalBackup(OUDE_BACKUP);
  assert.equal(state.portal.profile.headcount, 38);
  assert.equal(state.portal.profile.hourlyCost, 52);
  assert.equal(state.portal.market.industry, 'ICT & software');
  assert.equal(state.portal.metrics.revenue, 2400000);
  assert.equal(state.portal.tasks.items.length, 1, 'een taak zonder omschrijving hoort niet mee te komen');
  assert.equal(state.portal.tasks.items[0].title, 'Klantdata opschonen');
  assert.equal(state.portal.changes.items[0].change, 'Overstappen op Supabase');
});

test('alleen bestaande bedrijfsonderdelen krijgen een volwassenheidsniveau', () => {
  const state = vertaalOudePortaalBackup(OUDE_BACKUP);
  assert.deepEqual(state.portal.profile.maturity, { commercie: 4, operatie: 2 },
    'een onderdeel dat v2 niet kent hoort niet stilzwijgend mee te komen');
});

test('wat niet vertaald is, wordt bewaard én gemeld', () => {
  const state = vertaalOudePortaalBackup(OUDE_BACKUP);
  const verslag = state.portal.legacyImport;
  assert.equal(verslag.bron, 'klantportaal.html');
  assert.deepEqual(verslag.onvertaald, ['docs', 'esg', 'log', 'scanScore']);
  assert.ok(verslag.vertaald.includes('niveaus') && verslag.vertaald.includes('taken'));
  assert.deepEqual(verslag.ruw.docs, OUDE_BACKUP.docs, 'de onvertaalde gegevens zijn niet bewaard');
  assert.equal(verslag.ruw.scanScore, 72);
});

test('het voorbeeld zegt wat er verandert zonder iets te schrijven', () => {
  const nieuw = vertaalOudePortaalBackup(OUDE_BACKUP);
  const voorbeeld = voorbeeldVanImport({}, nieuw);
  assert.equal(voorbeeld.takenDelta, 1);
  assert.equal(voorbeeld.wijzigingenDelta, 1);
  assert.equal(voorbeeld.onvertaald, 4);
  assert.ok(voorbeeld.vertaald >= 6);
});

test('de importketen accepteert de oude back-up en breekt de bestaande niet', async () => {
  const oud = await stagePortalImport(bestand(OUDE_BACKUP), { currentState: {} });
  assert.equal(oud.kind, 'klantportaal-v1');
  assert.ok(oud.candidate.portal.legacyImport.ruw, 'de ruwe back-up is niet bewaard');
  assert.equal(oud.preview.onvertaald, 4, 'het voorbeeld verzwijgt wat er niet is vertaald');

  const canoniek = await stagePortalImport(bestand({ version: 4, state: { company: { name: 'X' } } }), { currentState: {} });
  assert.equal(canoniek.kind, 'canonical-v4');

  await assert.rejects(stagePortalImport(bestand({ version: 9 }), { currentState: {} }), /UNSUPPORTED_PORTAL_BACKUP/);
});
