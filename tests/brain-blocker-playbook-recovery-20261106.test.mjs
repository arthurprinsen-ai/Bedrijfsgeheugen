import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20261106140000_powerhouse_blocker_playbook_recovery_v1.sql', 'utf8');
const code = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
const reg = JSON.parse(readFileSync('brain/content-publication-blocker-register.json', 'utf8'));

test('every playbook code is in the blocker register and vice versa', () => {
  const seeded = [...code.matchAll(/^\s*\('([A-Z0-9_]+)',/gm)].map((m) => m[1]);
  const registered = reg.provider_and_obligation_blockers.map((b) => b.code.split(':')[0]);
  assert.ok(seeded.length >= 16);
  for (const c of seeded) assert.ok(registered.includes(c), `${c} missing in register`);
  for (const c of registered) assert.ok(seeded.includes(c), `${c} missing in playbook`);
});

test('stuck publications escalate with owner and unknown codes become incidents', () => {
  assert.match(code, /blocker-escalated:/);
  assert.match(code, /blocker-unregistered:/);
  assert.match(code, /brain_observe_failure/);
  assert.match(code, /m->>'owner'/);
  assert.doesNotMatch(code, /cron\.schedule/);
});

test('stage runs isolated in the existing tick before dispatch and never republishes', () => {
  const tick = code.slice(code.indexOf('powerhouse_content_closed_loop_tick_v1'));
  const stage = tick.indexOf('powerhouse_recover_stuck_publications_v1');
  assert.ok(stage > 0 && stage < tick.indexOf('net.http_post'));
  assert.match(tick, /stuck-recovery/);
  assert.doesNotMatch(code, /update public\.content_publication_obligations/);
});

test('function is service_role only', () => {
  assert.match(code, /revoke all on function public\.powerhouse_recover_stuck_publications_v1[\s\S]*from public, anon, authenticated/);
  assert.match(code, /grant execute on function public\.powerhouse_recover_stuck_publications_v1[\s\S]*to service_role/);
});
