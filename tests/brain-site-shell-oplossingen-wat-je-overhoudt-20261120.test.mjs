import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyOplossingenWatJeOverhoudt } from '../tools/site-shell/apply-oplossingen-wat-je-overhoudt.mjs';

const nl = ['systemen-koppelen', 'ai-adoptie', 'ai-marketing-mkb', 'due-diligence']
  .map(slug => '<article class="seo-card"><h3>x</h3><p>y</p><a class="text-link" href="https://www.bedrijfsgeheugen.nl/' + slug + '">Bekijk →</a></article>').join('');
const en = nl.replaceAll('https://www.bedrijfsgeheugen.nl/', '/en/');

test('adds one outcome line per solution card, before the link', () => {
  const result = applyOplossingenWatJeOverhoudt(nl, 'nl');
  assert.equal((result.match(/data-bg-wat-je-overhoudt=/g) || []).length, 4);
  assert.match(result, /Wat je overhoudt:<\/strong> Je typt gegevens één keer in/);
  assert.ok(result.indexOf('data-bg-wat-je-overhoudt="due-diligence"') < result.indexOf('/due-diligence">'));
});

test('works for English links, is idempotent, and fails loudly without anchors', () => {
  const result = applyOplossingenWatJeOverhoudt(en, 'en');
  assert.equal((result.match(/data-bg-wat-je-overhoudt=/g) || []).length, 4);
  assert.equal(applyOplossingenWatJeOverhoudt(result, 'en'), result);
  assert.throws(() => applyOplossingenWatJeOverhoudt('<main></main>', 'nl'), /OPLOSSINGEN_OVERHOUDT_NO_ANCHOR/);
  assert.throws(() => applyOplossingenWatJeOverhoudt(nl, 'de'), /LOCALE_UNSUPPORTED/);
});

test('copy has no numbers, guarantees or exclamation marks', () => {
  const text = applyOplossingenWatJeOverhoudt(nl, 'nl').replace(/<[^>]+>/g, ' ');
  assert.ok(!/\d|garantie|gegarandeerd|!/.test(text.replace(/Bekijk|→/g, '')));
});

test('step runs after localization in the build pipeline', () => {
  const pipeline = readFileSync('tools/ci/netlify-build-entry.mjs', 'utf8');
  assert.ok(pipeline.indexOf("['oplossingen-wat-je-overhoudt'") > pipeline.indexOf("['localized-routes'"));
});
