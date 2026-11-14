import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261114164500_preserve_contact_authority_on_connection_refresh_v1.sql', import.meta.url), 'utf8');
const skill = readFileSync(new URL('../.agents/skills/powerhouse-daily-full-connection-enrichment/SKILL.md', import.meta.url), 'utf8');

test('both canonical refresh paths preserve already reviewed authority metadata', () => {
  assert.match(sql, /powerhouse_refresh_all_connection_enrichment_v1/);
  assert.match(sql, /powerhouse_refresh_connection_enrichment_batch_v1/);
  assert.match(sql, /powerhouse_connection_enrichment_state_v1\.source_snapshot \? ''email_authority''/);
  assert.match(sql, /''email_authority'', powerhouse_connection_enrichment_state_v1\.source_snapshot->''email_authority''/);
  assert.match(sql, /CONTACT_AUTHORITY_SOURCE_DRIFT/);
  assert.match(sql, /v_matches<>1/);
});
test('fix does not create a competing worker, send email or infer consent', () => {
  assert.doesNotMatch(sql, /\bcreate\s+(?:table|trigger|policy)\b|cron\.schedule|http_post|smtp|set\s+human_approved/i);
  assert.match(skill, /bronbewijs|source evidence/i);
  assert.match(skill, /geen.*scraping|geen scraping/i);
  assert.match(skill, /niet hetzelfde als verzendtoestemming/i);
});
