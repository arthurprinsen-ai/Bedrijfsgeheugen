import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('AI-ecosystem cache fragment closes the exact current copy gap', () => {
  const fragmentPath='config/bg-static-i18n-en.d/2026-09-25-ai-ecosystem.json';
  const fragment=JSON.parse(fs.readFileSync(fragmentPath,'utf8'));
  assert.equal(Object.keys(fragment).length,119);
  assert.equal(fragment['AI-ecosysteem'],'AI ecosystem');
  assert.match(fragment['Van losse AI-tools naar een werkend AI-ecosysteem'],/working AI ecosystem/i);
  assert.match(fragment['Laat je hele bedrijf'],/whole business/i);
});

test('canonical builder remains fail-closed and config-backed', () => {
  const builder=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(builder,/path\.join\(ROOT,'config','bg-static-i18n-en\.json'\)/);
  assert.match(builder,/path\.join\(ROOT,'config','bg-static-i18n-en\.d'\)/);
  assert.match(builder,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(builder,/STATIC_I18N_CACHE_COMPLETE/);
  assert.doesNotMatch(builder,/path\.join\(ROOT,'\.cache','bg-static-i18n-en\.json'\)/);
});
