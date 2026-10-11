import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
const config=readFileSync('supabase/config.toml','utf8');

test('reconciliation faults are isolated and do not abort other channel dispatches',()=>{
  assert.doesNotMatch(src,/if\s*\(first\.error\)\s*throw new Error\('RECONCILE_PRE_FAILED'\)/);
  assert.doesNotMatch(src,/if\s*\(final\.error\)\s*throw new Error\('RECONCILE_POST_FAILED'\)/);
  assert.match(src,/name:'reconcile_pre', ok:false, degraded:true/);
  assert.match(src,/name:'reconcile_post', ok:false, degraded:true/);
  assert.match(src,/reconciliationDegraded/);
  assert.match(src,/allOperationalGreen && !reconciliationDegraded/);
});
test('Instagram selection failure cannot block independent blog or LinkedIn',()=>{
  assert.doesNotMatch(src,/if\s*\(winner\.error\)\s*throw new Error\('INSTAGRAM_DAILY_WINNER_SELECTION_FAILED'\)/);
  assert.match(src,/name:'instagram_daily_winner', ok:false, degraded:true/);
  assert.match(src,/winner\.error \|\| winner\.data\?\.selected !== true/);
  assert.match(src,/name:'instagram_winner_media_job', ok:true, skipped:true/);
  assert.match(src,/\['linkedin_personal','powerhouse-social-publisher'/);
  assert.match(src,/\['linkedin_company','powerhouse-social-publisher'/);
  assert.match(src,/\['instagram_company','powerhouse-social-publisher'/);
  assert.match(src,/\['blog','powerhouse-blog-queue'/);
  assert.match(src,/Promise\.all\(deliveryLanes\.map/);
});
test('single authenticated content-loop retains lease, proof and dedupe',()=>{
  assert.match(src,/claimLoopLease\(runDate, leaseHolder\)/);
  assert.match(src,/releaseLoopLease\(runDate, leaseHolder\)/);
  assert.match(src,/x-powerhouse-token/);
  assert.match(src,/powerhouse-social-publisher', \{ runDate, mode: 'audit_only' \}/);
  assert.match(src,/GLOBAL_POST_DUPLICATE_BLOCKED:/);
  assert.match(src,/GREEN MEANS PROVIDER SIDE-EFFECT OR OUTCOME VERIFIED/);
});
test('protected production deployment includes canonical content-loop',()=>{
  assert.match(config,/\[functions\.powerhouse-content-loop\][\s\S]*?entrypoint\s*=\s*"\.\/functions\/powerhouse-content-loop\/index\.ts"/);
  assert.match(config,/\[functions\.powerhouse-content-loop\][\s\S]*?verify_jwt\s*=\s*false/);
});
