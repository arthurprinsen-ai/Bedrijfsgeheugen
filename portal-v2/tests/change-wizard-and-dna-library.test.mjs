import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPABILITIES, NIVEAUS, capabilityImpact, combinedImpact, searchCatalog, translateToModel } from '../capability-catalog.js';
import { wizardCompleteness, buildChange } from '../modules/change-wizard.js';
import { PROFILE_DIMENSIONS } from '../modules/company-input.js';

test('de kast is één op één overgenomen uit het oude portaal', () => {
  assert.ok(Object.keys(CAPABILITIES).length >= 12);
  assert.deepEqual(NIVEAUS, ['','in hoofden','in lijstjes','in systemen','verbonden','zelfsturend']);
  for (const [id, item] of Object.entries(CAPABILITIES)) {
    assert.ok(item.n, `${id} mist een naam`);
    assert.ok(item.dim, `${id} mist een onderdeel`);
    assert.ok(PROFILE_DIMENSIONS.some(dim => dim.id === item.dim), `${id} hangt aan onbekend onderdeel ${item.dim}`);
  }
});

test('impact verzamelt alles wat aan een onderdeel hangt, zonder dubbeltelling', () => {
  const impact = capabilityImpact('commercie');
  assert.ok(impact.capabilities.length > 0);
  assert.ok(impact.afd.length > 0);
  assert.equal(impact.afd.length, new Set(impact.afd).size);
  const leeg = capabilityImpact('onbekend-onderdeel');
  assert.deepEqual(leeg.capabilities, []);
});

test('gecombineerde impact telt overlappende afdelingen één keer', () => {
  const los = capabilityImpact('commercie').afd.length + capabilityImpact('tech').afd.length;
  const samen = combinedImpact(['commercie','tech']).afd.length;
  assert.ok(samen <= los);
  assert.equal(samen, new Set(combinedImpact(['commercie','tech']).afd).size);
});

test('zoeken vindt een capability via zijn systeem, niet alleen via zijn naam', () => {
  const opNaam = searchCatalog('Klantbeeld');
  assert.ok(opNaam.length >= 1);
  const opSysteem = searchCatalog('CRM');
  assert.ok(opSysteem.length >= 1);
  assert.ok(opSysteem.every(item => item.treffers.length > 0));
  assert.deepEqual(searchCatalog('zoiets-bestaat-niet'), []);
  assert.equal(searchCatalog('').length, Object.keys(CAPABILITIES).length);
});

test('eigen woorden worden teruggelegd op onderdelen van het model', () => {
  const uit = translateToModel('we willen onze offertes sneller opvolgen');
  assert.ok(uit.capabilities.length > 0);
  assert.ok(uit.dimensies.includes('commercie'));
  assert.equal(translateToModel('de en of').capabilities.length, 0, 'korte woorden mogen niets activeren');
});

test('de volledigheidsmeter telt precies de vier stappen uit het oude portaal', () => {
  assert.deepEqual(wizardCompleteness({}, 0), [false,false,false,false]);
  const compleet = { dimension:'commercie', toLevel:4, reason:'Klantdata staat op vier plekken', owner:'Sam' };
  assert.deepEqual(wizardCompleteness(compleet, 2), [true,true,true,true]);
  assert.deepEqual(
    wizardCompleteness({ ...compleet, toLevel:2 }, 2)[1], false,
    'dezelfde waarde kiezen is geen wijziging'
  );
});

test('een ingediende wijziging staat op Open en geldt dus nog niet', () => {
  const change = buildChange({ dimension:'commercie', toLevel:4, reason:'Klantdata staat op vier plekken', owner:'Sam', effectiveDate:'2026-10-01' }, 2);
  assert.equal(change.status, 'Open');
  assert.equal(change.fromLevel, 2);
  assert.equal(change.toLevel, 4);
  assert.equal(change.owner, 'Sam');
  assert.match(change.change, /verbonden/);
  assert.ok(change.impact > 0, 'de impact wordt bij het voorstel vastgelegd');
});
