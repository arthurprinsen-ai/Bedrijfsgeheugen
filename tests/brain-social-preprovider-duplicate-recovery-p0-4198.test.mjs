import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const social=read('supabase/functions/powerhouse-social-publisher/index.ts');
const orchestrator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const loop=read('supabase/functions/powerhouse-content-loop/index.ts');

test('a global story duplicate must BLOCK provider delivery without fake sent/republish proof',()=>{
  const i=social.indexOf("global_uniqueness_gate:'blocked'");
  assert.ok(i>0);
  const candidate=social.slice(i,i+650);
  assert.match(candidate,/republish_forbidden:false/);
  assert.match(candidate,/uniqueness_denied_pre_provider:true/);
  assert.match(social,/GLOBAL_POST_DUPLICATE_BLOCKED/);
  assert.match(social,/reserveGlobalUniquePublication/);
});
test('canonical orchestrator only reopens pre-provider duplicates, not any ambiguous send',()=>{
  assert.match(orchestrator,/function recoverableUniquenessDenial/);
  for(const g of ["clean(row.state)!=='blocked'","clean(row.delivery_ref)","authority.issued===true","authority.consumed===false","evidence.provider_create_success!==true","evidence.provider_publication_ack_verified!==true","evidence.provider_truth_verified!==true","evidence.possible_provider_side_effect!==true"])assert.ok(orchestrator.includes(g),g);
  assert.match(orchestrator,/if\(recoverableUniquenessDenial\(row\)\) return false/);
  assert.match(orchestrator,/const stale = personalNoGapReopen \|\| recoverableUniquenessDenial\(previous\)/);
});
test('supervisor safely resumes single existing orchestrator and never skips full provider controls',()=>{
  assert.match(loop,/evidence\.publication_authority\?\.consumed === false/);
  assert.match(loop,/evidence\.global_uniqueness_gate === 'blocked'/);
  assert.match(loop,/evidence\.possible_provider_side_effect !== true/);
  assert.match(loop,/!clean\(decision\.delivery_ref\)/);
  assert.match(loop,/evidence\.provider_create_success !== true/);
  assert.match(loop,/evidence\.provider_publication_ack_verified !== true/);
  assert.match(loop,/evidence\.provider_truth_verified !== true/);
  assert.match(loop,/claimLoopLease\(runDate, leaseHolder\)/);
  assert.match(loop,/powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}/);
});
