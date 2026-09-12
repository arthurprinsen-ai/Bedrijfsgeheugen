import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const migrationsUrl = new URL('../supabase/migrations/', import.meta.url);

test('historical Notion staging migration is safe when notion_synced_posts is absent', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260909181648_notion_post_feature_staging.sql', import.meta.url), 'utf8');
  assert.match(sql, /create\s+table\s+if\s+not\s+exists\s+public\.notion_synced_posts/i);
  assert.match(sql, /alter\s+table\s+public\.notion_synced_posts/i);
});

test('a later migration bootstraps notion_synced_posts reproducibly', async () => {
  const names = (await readdir(migrationsUrl)).filter(name => /^20260912\d+_.*notion_synced_posts.*\.sql$/i.test(name));
  assert.ok(names.length > 0, 'missing current Notion synced-posts bootstrap migration');
  const sql = await readFile(new URL(`../supabase/migrations/${names.sort().at(-1)}`, import.meta.url), 'utf8');
  assert.match(sql, /create\s+table\s+if\s+not\s+exists\s+public\.notion_synced_posts/i);
  assert.match(sql, /post_id\s+text\s+primary\s+key/i);
  assert.match(sql, /enable\s+row\s+level\s+security/i);
  assert.match(sql, /notion_synced_posts_campaign_key_idx/i);
  assert.match(sql, /notion_synced_posts_external_post_idx/i);
});
