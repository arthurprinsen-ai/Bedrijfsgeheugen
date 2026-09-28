import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260928140500_provider_side_effect_terminal_fence_v1.sql','utf8');

test('provider-created social side effects are terminal anti-duplicate evidence',()=>{
  assert.match(sql,/powerhouse_provider_side_effect_proven_v1/);
  assert.match(sql,/provider_create_success/);
  assert.match(sql,/provider_publication_ack_verified/);
  assert.match(sql,/republish_forbidden/);
  assert.match(sql,/state='published'/);
  assert.match(sql,/status='PUBLISHED'/);
});

test('readback and post-publish media limitations cannot downgrade provider-created posts',()=>{
  assert.match(sql,/Exact-final-media is a PRE-PUBLISH gate/);
  assert.match(sql,/not public\.powerhouse_provider_side_effect_proven_v1\(external_id,evidence\)/);
  assert.match(sql,/PROVIDER_SIDE_EFFECT_TERMINAL_FENCE/);
});

test('daily watchdog and assertion accept provider-created published social obligations',()=>{
  assert.match(sql,/daily-publication-invariant-v2/);
  assert.match(sql,/channel in \('linkedin_personal','linkedin_company','instagram'\)/);
  assert.match(sql,/status='PUBLISHED'/);
  assert.match(sql,/terminal_fence','provider-side-effect-terminal-fence-v1'/);
});
