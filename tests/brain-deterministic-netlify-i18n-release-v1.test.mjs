import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Netlify release builds keep static i18n network-disabled by default', () => {
  const netlify=fs.readFileSync('netlify.toml','utf8');
  const localized=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');
  assert.match(netlify,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(localized,/STATIC_I18N_OFFLINE_RELEASE/);
  assert.match(localized,/STATIC_I18N_NETWORK/);
  assert.match(localized,/networkAllowed/);
  assert.doesNotMatch(localized,/if \(process\.env\.CONTEXT === 'production'\) throw new Error\('ANTHROPIC_API_KEY/);
});
