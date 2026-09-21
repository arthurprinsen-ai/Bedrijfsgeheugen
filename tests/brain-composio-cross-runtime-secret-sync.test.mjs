import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../netlify/functions/powerhouse-composio-secret-sync.mjs',import.meta.url),'utf8');

test('Composio secret sync bridges Netlify production secret to canonical Supabase onboarding without exposing it',()=>{
  assert.match(source,/process\.env\.COMPOSIO_API_KEY/);
  assert.match(source,/process\.env\.BG_PORTAL_EU_SUPABASE_URL/);
  assert.match(source,/process\.env\.BG_PORTAL_EU_SERVICE_TOKEN/);
  assert.match(source,/action:'status'/);
  assert.match(source,/action:'set_api_key',api_key:apiKey/);
  assert.match(source,/x-bg-service-token/);
  assert.match(source,/secret_values_exposed:false/);
  assert.doesNotMatch(source,/console\.log\(.*apiKey/);
});

test('Composio secret sync is bounded and runs before the Amsterdam daytime publish window',()=>{
  assert.match(source,/if\(status\.response\.ok&&status\.data\?\.api_key_present===true\)/);
  assert.match(source,/schedule:'17 4 \* \* \*'/);
});
