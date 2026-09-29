import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');

test('terminal provider truth precedes replacement logic',()=>{
  assert.match(router,/const providerTerminal=historical/);
  assert.match(router,/provider_publication_ack_verified===true/);
  assert.match(router,/provider_truth_verified===true/);
  assert.match(router,/terminal_provider_side_effect===true/);
  assert.match(router,/status:'LIVE_PROVEN'/);
  assert.ok(router.indexOf('if(providerTerminal)') < router.indexOf("status:'REPLACEMENT_REQUIRED'"));
});

test('terminal provider truth preserves anti-duplicate contract',()=>{
  assert.match(router,/republish_forbidden:true/);
  assert.match(router,/Collect outcomes only; terminal provider side effect is authoritative\. Never republish\./);
  assert.match(router,/terminality_contract:'social-provider-write-terminal-v1'/);
});
