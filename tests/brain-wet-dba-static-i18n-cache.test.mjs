import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const patchUrl = new URL('../config/bg-static-i18n-en.d/2026-10-03-wet-dba-blog.json', import.meta.url);
const patch = JSON.parse(await readFile(patchUrl, 'utf8'));

test('historical replay: Wet DBA static i18n patch closes all 66 missing cache entries', () => {
  assert.equal(Object.keys(patch).length, 66);
  assert.equal(
    patch['Wet DBA en zelfstandigen: wat verandert er en wat betekent dat voor jou?'],
    'Wet DBA and self-employed professionals: what is changing and what does it mean for you?'
  );
  assert.equal(patch['Handhaving is al begonnen'], 'Enforcement has already begun');
  assert.equal(patch['Wat is de Wet DBA precies?'], 'What exactly is the Wet DBA?');
});

test('historical replay: every cache entry is a non-empty English translation', () => {
  for (const [source, translated] of Object.entries(patch)) {
    assert.equal(typeof translated, 'string', source);
    assert.ok(translated.trim().length > 0, source);
    assert.notEqual(translated.trim(), source.trim(), source);
  }
});
