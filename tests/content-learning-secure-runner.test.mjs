import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function text(path) {
  try { return await readFile(path, 'utf8'); }
  catch { return ''; }
}

test('paid and mutating content-learning edge functions require service-role caller authentication', async () => {
  for (const path of [
    'supabase/functions/bg-analytics-sync-composio/index.ts',
    'supabase/functions/bg-native-content-generate/index.ts'
  ]) {
    const code = await text(path);
    assert.match(code, /req\.headers\.get\(['"]authorization['"]\)/i, `${path} must read caller authorization`);
    assert.match(code, /SERVICE_ROLE_REQUIRED/, `${path} must fail closed for non-service callers`);
    assert.match(code, /Bearer \$\{serviceKey\}/, `${path} must require the configured service-role bearer`);
  }
});

test('database migration cannot schedule an anonymous paid generation request', async () => {
  const sql = await text('supabase/migrations/20260909_native_content_generation_cron.sql');
  assert.doesNotMatch(sql, /http_post[\s\S]*bg-native-content-generate/i);
  assert.match(sql, /cron\.unschedule/i);
});

test('native daily workflow invokes analytics then generation with repository secrets', async () => {
  const workflow = await text('.github/workflows/content-learning-daily.yml');
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron:\s*['"]?15 2 \* \* \*['"]?/);
  assert.match(workflow, /SUPABASE_URL:\s*\$\{\{ secrets\.SUPABASE_URL \}\}/);
  assert.match(workflow, /SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{ secrets\.SUPABASE_SERVICE_ROLE_KEY \}\}/);
  const analytics = workflow.indexOf('/functions/v1/bg-analytics-sync-composio');
  const generation = workflow.indexOf('/functions/v1/bg-native-content-generate');
  assert.ok(analytics >= 0 && generation > analytics, 'analytics sync must run before generation');
  assert.match(workflow, /Authorization: Bearer \$SUPABASE_SERVICE_ROLE_KEY/);
});
