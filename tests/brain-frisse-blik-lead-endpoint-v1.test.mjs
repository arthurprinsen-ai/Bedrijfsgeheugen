import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../frisse-blik.html', import.meta.url), 'utf8');
const fn = 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/lead-intake';

test('historical replay: the lead form has a real endpoint, not an empty string', () => {
  const m = html.match(/const WEBHOOK_URL='([^']*)';/);
  assert.ok(m, 'WEBHOOK_URL constant not found');
  assert.equal(m[1], fn);
});

test('shadow: the consent check and submit flow are still present', () => {
  assert.match(html, /ldOk'\)\.checked/);
  assert.match(html, /async function submitLead\(\)/);
  assert.match(html, /fetch\(WEBHOOK_URL,\{method:'POST'/);
});

test('canary: no service secret is embedded in the public page', () => {
  assert.doesNotMatch(html, /service_role|SUPABASE_SERVICE_ROLE|sb_secret_/i);
});
