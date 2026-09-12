import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('historical Notion staging migration bootstraps before altering notion_synced_posts', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260909181648_notion_post_feature_staging.sql', import.meta.url), 'utf8');
  assert.match(sql, /create\s+table\s+if\s+not\s+exists\s+public\.notion_synced_posts/i);
  assert.match(sql, /post_id\s+text\s+primary\s+key/i);
  assert.match(sql, /alter\s+table\s+public\.notion_synced_posts/i);
  const createAt = sql.search(/create\s+table\s+if\s+not\s+exists\s+public\.notion_synced_posts/i);
  const alterAt = sql.search(/alter\s+table\s+public\.notion_synced_posts/i);
  assert.ok(createAt >= 0 && alterAt > createAt, 'bootstrap must execute before the historical ALTER');
  assert.match(sql, /notion_synced_posts_campaign_key_idx/i);
  assert.match(sql, /notion_synced_posts_external_post_idx/i);
});
