import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production builds static English while deploy previews stay deterministic offline', () => {
  const netlify=fs.readFileSync('netlify.toml','utf8');
  const localized=fs.readFileSync('tools/site-shell/build-localized-routes.mjs','utf8');

  const buildEnvironment=netlify.match(/\[build\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';
  const previewEnvironment=netlify.match(/\[context\.deploy-preview\.environment\]([\s\S]*?)(?=\n\[|$)/)?.[1] || '';

  assert.match(buildEnvironment,/STATIC_I18N_NETWORK\s*=\s*"1"/);
  assert.match(previewEnvironment,/STATIC_I18N_NETWORK\s*=\s*"0"/);
  assert.match(localized,/STATIC_I18N_OFFLINE_RELEASE/);
  assert.match(localized,/STATIC_I18N_NETWORK/);
  assert.match(localized,/networkAllowed/);
  assert.doesNotMatch(localized,/if \(process\.env\.CONTEXT === 'production'\) throw new Error\('ANTHROPIC_API_KEY/);
});
