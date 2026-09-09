import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const edgeUrl = new URL('../supabase/functions/powerhouse-runtime/index.ts', import.meta.url);
const migrationUrl = new URL('../supabase/migrations/20260909090000_powerhouse_v96_supabase_native_runtime.sql', import.meta.url);

async function source() {
  return readFile(edgeUrl, 'utf8');
}

async function migration() {
  return readFile(migrationUrl, 'utf8');
}

test('Powerhouse v96 critical path is Supabase-native and contains no Make runtime dependency', async () => {
  const code = await source();
  assert.match(code, /powerhouse-v96-supabase-native/);
  assert.match(code, /makeCriticalPath:false/);
  assert.doesNotMatch(code, /hook\.eu\d+\.make\.com|api\.make\.com|BG168|BG166|BG167/i);
});

test('DM reply generation fails closed when real conversation context is absent', async () => {
  const code = await source();
  assert.match(code, /Geen echte DM-gesprekcontext beschikbaar; daarom geen antwoord genereren\./);
  assert.match(code, /message_draft:''/);
  assert.match(code, /latestInbound/);
  assert.match(code, /conversationText/);
});

test('WhatsApp is only selected with a real phone number and explicit permission', async () => {
  const code = await source();
  assert.match(code, /clean\(c\?\.phone\)&&c\?\.whatsappAllowed===true/);
  assert.match(code, /return'WhatsApp'/);
  assert.match(code, /if\(clean\(c\?\.email\)\)return'E-mail'/);
  assert.match(code, /return'LinkedIn DM'/);
});

test('learning outcome feeds the next priority decision', async () => {
  const code = await source();
  assert.match(code, /async function learnedAdjustment/);
  assert.match(code, /effect\?\.priority_delta/);
  assert.match(code, /const learned=await learnedAdjustment\(subject\)/);
  assert.match(code, /basePriority\(e\)\+learned/);
  assert.match(code, /learned_priority_delta:learned/);
});

test('action queue is bounded and outcome recording closes the same loop', async () => {
  const sql = await migration();
  assert.match(sql, /powerhouse_action_queue\(p_limit integer default 15\)/);
  assert.match(sql, /limit greatest\(1,least\(coalesce\(p_limit,15\),50\)\)/);
  assert.match(sql, /powerhouse_record_outcome/);
  assert.match(sql, /state='closed'/);
});

test('runtime tables are private by default and service-role only', async () => {
  const sql = await migration();
  for (const table of ['powerhouse_device_tokens','powerhouse_runtime_events','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_sales_learnings']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
    assert.match(sql, new RegExp(`revoke all on public\\.${table} from anon, authenticated`, 'i'));
    assert.match(sql, new RegExp(`grant all on public\\.${table} to service_role`, 'i'));
  }
});

test('no private Chrome device token is committed to repository source', async () => {
  const code = await source();
  const sql = await migration();
  const forbidden = '8_0TRzTW1Zimx8BtC3Yrbt7OnrapBL16UaJTWUUidss';
  assert.equal(code.includes(forbidden), false);
  assert.equal(sql.includes(forbidden), false);
});
