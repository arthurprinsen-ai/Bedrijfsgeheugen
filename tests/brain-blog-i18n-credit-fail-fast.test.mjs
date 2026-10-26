import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const builder=readFileSync(new URL('../tools/site-shell/build-localized-routes.mjs',import.meta.url),'utf8');

test('daily blog cache gap report contains exact source keys only in scoped prepare mode',()=>{
  assert.match(builder,/if \(PREPARE_CACHE_PATCH_NAME\) \{\s+console\.log\('STATIC_I18N_CACHE_GAPS_V1'/);
  assert.match(builder,/total: missing\.length/);
  assert.match(builder,/sources: missing\.slice\(0,80\)/);
  assert.match(builder,/if \(!missing\.length\) return result/);
});
test('provider credit exhaustion fails promptly without recursive splitting',()=>{
  assert.match(builder,/status === 400 \|\| status === 402 \|\| status === 429/);
  assert.match(builder,/credit balance is too low\|insufficient.quota\|billing/);
  assert.match(builder,/throw new Error\('STATIC_I18N_PROVIDER_BILLING_BLOCKED:/);
  assert.match(builder,/if \(part\.length > 1\)/);
});
test('production EN translation gates still fail closed',()=>{
  assert.match(builder,/STATIC_I18N_CACHE_INCOMPLETE/);
  assert.match(builder,/STATIC_I18N_PREPARE_INCOMPLETE/);
  assert.match(builder,/STATIC_I18N_PRODUCTION_TRANSLATION_FAILED/);
  assert.match(builder,/if \(!networkAllowed\) \{/);
});
