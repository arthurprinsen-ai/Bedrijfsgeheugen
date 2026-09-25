import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

test('versioned English cache covers the current public static i18n corpus', async () => {
  const cache = JSON.parse(await readFile('data/i18n/bg-static-i18n-en.json', 'utf8'));
  assert.ok(Object.keys(cache).length >= 7000, 'translation cache unexpectedly small');
  const output = execFileSync(process.execPath, ['tools/site-shell/build-localized-routes.mjs', '--validate-cache'], {
    encoding: 'utf8',
    env: { ...process.env, STATIC_I18N_NETWORK: '0' },
  });
  assert.match(output, /STATIC_I18N_CACHE_COMPLETE/);
});

test('production remains fail closed if a future source string is not cached and provider fill fails', async () => {
  const source = await readFile('tools/site-shell/build-localized-routes.mjs', 'utf8');
  assert.match(source, /STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(source, /STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED/);
  assert.match(source, /STATIC_I18N_CACHE_INCOMPLETE/);
});


test('delivery classifier owns versioned i18n data as website shell', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const website = policy.lanes.find(lane => lane.id === 'website');
  const shell = policy.conflictContracts.find(contract => contract.id === 'website-shell-contract');
  assert.ok(website?.paths.includes('data/i18n/'));
  assert.ok(shell?.paths.includes('data/i18n/'));
});
