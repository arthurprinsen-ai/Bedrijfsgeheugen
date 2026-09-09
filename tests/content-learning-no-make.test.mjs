import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  'supabase/functions/bg-native-content-generate/index.ts',
  'supabase/functions/bg-notion-sync/index.ts',
  'supabase/functions/bg-analytics-sync-composio/index.ts',
  'supabase/migrations/20260909_native_content_generation_cron.sql',
];

test('native content-learning path has no Make runtime dependency', () => {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /make\.com|hook\.eu\d+\.make|scenarioId|BG 09/i, `${file} must remain Make-independent`);
  }
});
