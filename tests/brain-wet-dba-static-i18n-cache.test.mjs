import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const patch = JSON.parse(await readFile(
  new URL('../config/bg-static-i18n-en.d/2026-10-03-wet-dba-blog.json', import.meta.url),
  'utf8'
));

test('historical replay: Wet DBA cache closes all 74 source and build-derived gaps', () => {
  assert.equal(Object.keys(patch).length, 74);
  assert.equal(
    patch['Wet DBA en zelfstandigen: wat verandert er en wat betekent dat voor jou?'],
    'Wet DBA and self-employed professionals: what is changing and what does it mean for you?'
  );
  assert.equal(patch['Handhaving is al begonnen'], 'Enforcement has already begun');
  assert.equal(patch['Wat is de Wet DBA precies?'], 'What exactly is the Wet DBA?');
  assert.equal(patch['Inhoudelijk bijgewerkt 2026-10-03'], 'Content updated 2026-10-03');
  assert.equal(
    patch['Maar let op: een modelovereenkomst biedt alleen zekerheid als de'],
    'But note: a model agreement only provides certainty if the'
  );
});

test('historical replay: every recovered cache entry is a non-empty translation', () => {
  for (const [source, translated] of Object.entries(patch)) {
    assert.equal(typeof translated, 'string', source);
    assert.ok(translated.trim().length > 0, source);
    assert.notEqual(translated.trim(), source.trim(), source);
  }
});
