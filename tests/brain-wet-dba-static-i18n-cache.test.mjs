import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const basePatch = JSON.parse(await readFile(
  new URL('../config/bg-static-i18n-en.d/2026-10-03-wet-dba-blog.json', import.meta.url),
  'utf8'
));
const derivedPatch = JSON.parse(await readFile(
  new URL('../config/bg-static-i18n-en.d/2026-10-03-wet-dba-build-derived.json', import.meta.url),
  'utf8'
));

test('historical replay: Wet DBA source cache closes all 66 original missing entries', () => {
  assert.equal(Object.keys(basePatch).length, 66);
  assert.equal(
    basePatch['Wet DBA en zelfstandigen: wat verandert er en wat betekent dat voor jou?'],
    'Wet DBA and self-employed professionals: what is changing and what does it mean for you?'
  );
  assert.equal(basePatch['Handhaving is al begonnen'], 'Enforcement has already begun');
  assert.equal(basePatch['Wat is de Wet DBA precies?'], 'What exactly is the Wet DBA?');
});

test('historical replay: final build-derived cache closes all 8 transform-generated entries', () => {
  assert.equal(Object.keys(derivedPatch).length, 8);
  assert.equal(derivedPatch['Inhoudelijk bijgewerkt 2026-10-03'], 'Content updated 2026-10-03');
  assert.equal(
    derivedPatch['Maar let op: een modelovereenkomst biedt alleen zekerheid als de'],
    'But note: a model agreement only provides certainty if the'
  );
});

test('historical replay: every recovered cache entry is a non-empty translation', () => {
  for (const patch of [basePatch, derivedPatch]) {
    for (const [source, translated] of Object.entries(patch)) {
      assert.equal(typeof translated, 'string', source);
      assert.ok(translated.trim().length > 0, source);
      assert.notEqual(translated.trim(), source.trim(), source);
    }
  }
});
