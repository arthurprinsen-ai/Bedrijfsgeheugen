import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const site=fs.readFileSync(new URL('../netlify/functions/vraag.mjs',import.meta.url),'utf8');
test('original website AI failures are classified without payload or credentials',()=>{
  assert.match(site,/ORIGINAL_WEBSITE_AI_FAILURE/);
  assert.match(site,/failure_class:known/);
  assert.match(site,/OPENAI_PROVIDER_ERROR_/);
  assert.match(site,/OPENAI_EMPTY_RESPONSE/);
  assert.match(site,/OPENAI_REFUSAL/);
  assert.doesNotMatch(site,/console\.error\(error\)|console\.error\(detail\)|console\.error\(vraag\)/);
  assert.match(site,/return Response\.json\(\{ fout:'De zoekfunctie is even niet bereikbaar\.' \}, \{ status:502 \}\)/);
  assert.match(site,/process\.env\.OPENAI_API_KEY/);
});
