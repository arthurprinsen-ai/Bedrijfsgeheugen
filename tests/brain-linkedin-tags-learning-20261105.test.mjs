import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const migrationsDir = new URL('../supabase/migrations/', import.meta.url);
const file = readdirSync(migrationsDir).find(f => f.endsWith('_original_linkedin_tags_learning_v1.sql'));
const sql = file ? readFileSync(new URL(file, migrationsDir), 'utf8') : '';
const base = readFileSync(new URL('../supabase/migrations/20261105080000_original_linkedin_learning_source_truth.sql', import.meta.url), 'utf8');
const lock = JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const migrations = readdirSync(new URL('../supabase/migrations/', import.meta.url));

test('migration was applied by the provider (version 20261105165702) and is recorded in source and lock', () => {
  assert.equal(file, '20261105165702_original_linkedin_tags_learning_v1.sql');
  assert.ok(lock.applied.some(r => r.version === '20261105165702' && r.name === 'original_linkedin_tags_learning_v1'), 'lock row missing');
  assert.ok(!readdirSync(new URL('../supabase/', import.meta.url)).includes('migrations-pending'), 'no pending migration directory may remain');
  assert.match(sql, /^-- APPLIED op productie/);
  assert.doesNotMatch(sql, /^\s*(begin|commit);/im);
});

test('owner stays the original loop: no new table, cron, sender or publisher', () => {
  assert.doesNotMatch(sql, /create table/i);
  assert.doesNotMatch(sql, /cron\.schedule|pg_net|http_post|net\.http/i);
  assert.match(sql, /create or replace function public\.bg_social_lus_cyclus\(p_channel text, p_run_date date default current_date\)/);
});

test('only bg_post_kenmerken is written; social_posts and snapshots are read-only', () => {
  assert.doesNotMatch(sql, /(insert into|update|delete from)\s+public\.social_(posts|metric_snapshots)/);
  assert.match(sql, /update public\.bg_post_kenmerken k/);
  assert.match(sql, /add column if not exists tags text\[\]/);
  assert.match(sql, /add column if not exists tags_bron text/);
});

test('backfill never guesses: unique channel-day match, published artifact, unknown stays NULL, idempotent', () => {
  assert.match(sql, /pc\.n = 1/);
  assert.match(sql, /a\.n = 1 and a\.status = 'published'/);
  assert.match(sql, /where k\.post_key = z\.post_id and k\.tags is null/);
  assert.match(sql, /artifact-datum-kanaal-uniek/);
  assert.match(sql, /posts_zonder_tagbron/);
});

test('all new and replaced functions are search_path-locked and service_role only', () => {
  for (const sig of ['bg_tags_uit_tekst\\(text\\)', 'bg_post_tags_backfill\\(\\)', 'bg_social_lus_cyclus\\(text,date\\)']) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${sig} from public, ?anon, ?authenticated`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${sig} to service_role`));
  }
  assert.match(sql, /set search_path = ''/);
});

test('tags become one dimension in both LinkedIn channels with the same one-variable rule', () => {
  assert.match(sql, /array\['format', 'cta_type', 'hook_type', 'tags'\]/);
  assert.match(sql, /array\['hook_type', 'lengte', 'slotvraag', 'tags'\]/);
  assert.match(sql, /when d\.dim = 'tags' then array\['drie_hashtags', 'geen_hashtags'\]/);
  assert.match(sql, /EXPERIMENT_LOOPT/);
  assert.match(sql, /on conflict \(tenant_id, experiment_id\) do nothing/);
});

test('tag instruction forbids engagement bait and keeps the no-winner wording', () => {
  assert.match(sql, /precies 3 inhoudelijke hashtags/);
  assert.match(sql, /geen verzoek om te taggen, te liken of te delen/);
  assert.match(sql, /geen engagement bait/);
  assert.match(sql, /Presenteer dit nooit als bewezen winnaar/);
});

test('a backfill error cannot break the loop but stays visible in the result', () => {
  assert.match(sql, /exception when others then/);
  assert.match(sql, /'state', 'FOUT'/);
  assert.match(sql, /'tags_backfill', v_tags/);
});

test('replaced loop function keeps every original behaviour of 20261105080000', () => {
  for (const frag of ['bg_social_lus_beoordelen(p_run_date)', "recipe->>'soort' = 'linkedin_lus'", 'revenue_learnings', "md5(s.dim || s.waarde || p_run_date::text)", "interval '90 days'", "'agent:bg-linkedin-lus'"]) {
    assert.ok(base.includes(frag) && sql.includes(frag), `lost: ${frag}`);
  }
});

test('hashtag extraction rule is documented in the SQL: hashtag preceded by start, whitespace or bracket, starting with a letter', () => {
  assert.match(sql, /\(\?:\^\|\[\[:space:\]\(\]\)#\(\[\[:alpha:\]\]\[\[:alnum:\]_\]\{1,48\}\)/);
  assert.match(sql, /array_agg\(distinct lower\(m\[1\]\) order by lower\(m\[1\]\)\)/);
});
