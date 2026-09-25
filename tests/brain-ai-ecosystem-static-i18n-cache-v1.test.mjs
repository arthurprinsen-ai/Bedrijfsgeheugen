import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('AI ecosystem public copy remains covered by canonical English cache while production can fall back at runtime', async () => {
  const [patchRaw,builder,netlify,runtime] = await Promise.all([
    readFile('config/bg-static-i18n-en.d/2026-09-25-ai-ecosystem.json','utf8'),
    readFile('tools/site-shell/build-localized-routes.mjs','utf8'),
    readFile('netlify.toml','utf8'),
    readFile('assets/js/i18n.js','utf8')
  ]);
  const patch = JSON.parse(patchRaw);

  assert.ok(Object.keys(patch).length >= 120, 'AI ecosystem translation patch unexpectedly small');
  assert.equal(
    patch['AI-ecosysteem voor het mkb | Data, systemen, processen en AI-agents | Bedrijfsgeheugen'],
    'AI ecosystem for SMEs | Data, systems, processes and AI agents | Bedrijfsgeheugen'
  );
  assert.equal(patch['Laat je hele bedrijf'],'Make your entire business');
  assert.equal(patch['samenwerken met AI.'],'work together with AI.');

  assert.match(builder,/bg-static-i18n-en\.json/);
  assert.match(builder,/bg-static-i18n-en\.d/);
  assert.match(builder,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(netlify,/STATIC_I18N_REQUIRE_CACHE\s*=\s*"0"/);
  assert.match(runtime,/\/api\/i18n-translate/);
});
