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
  assert.match(orchestrator,/const recoverableDuplicate=recoverableUniquenessDenial\(previous\)/);
  assert.match(orchestrator,/const stale = personalNoGapReopen \|\| recoverableDuplicate/);
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
  assert.match(loop,/\['linkedin_personal','powerhouse-social-publisher',\{runDate,mode:'publish_only',channels:\['linkedin_personal'\]\}\]/);
  assert.match(loop,/\['linkedin_company','powerhouse-social-publisher',\{runDate,mode:'publish_only',channels:\['linkedin_company'\]\}\]/);
});


test('canonical obligation duplicate denial reopens one blocked hold only with unconsumed authority and no side effect',()=>{
 assert.match(orchestrator,/function recoverableObligationUniquenessDenial\(row:any,obligation:any,consumedCapability:boolean\)/);
 assert.match(orchestrator,/clean\(obligation\.status\)\.toUpperCase\(\)!=='BLOCKED'/);
 assert.match(orchestrator,/clean\(obligation\.external_id\)/);
 assert.match(orchestrator,/clean\(obligation\.last_error\)\.startsWith\('GLOBAL_POST_DUPLICATE_BLOCKED:'\)/);
 assert.match(orchestrator,/evidence\.global_uniqueness_gate!=='blocked'/);
 assert.match(orchestrator,/authority\.issued!==true\|\|authority\.consumed!==false/);
 assert.match(orchestrator,/candidate\.provider_create_success===true/);
 assert.match(orchestrator,/candidate\.possible_provider_side_effect===true/);
 assert.match(orchestrator,/candidate\.republish_forbidden===true/);
 assert.match(orchestrator,/consumedCapabilityChannels\.has\(channel\)/);
 assert.match(orchestrator,/select\('channel,evidence,status,last_error,external_id'\)/);
 assert.match(orchestrator,/priorPersonalObligation=obligations\.find/);
 assert.match(orchestrator,/personalDuplicateRecovery = recoverableUniquenessDenial\(priorPersonal\)/);
 assert.match(orchestrator,/currentObligation=obligations\.find/);
 assert.match(orchestrator,/obligationRejected/);
});

test('obligation-only duplicates keep different personal source lineage and cannot requeue same source forever',()=>{
 assert.match(orchestrator,/priorPersonalObligation\?\.evidence\?\.personal_source_recommendation_id/);
 assert.match(orchestrator,/priorPersonalObligation\?\.evidence\?\.fallback_recommendation_id/);
 assert.match(orchestrator,/currentObligation\?\.evidence\?\.personal_source_recommendation_id/);
 assert.match(orchestrator,/currentObligation\?\.evidence\?\.fallback_recommendation_id/);
 assert.match(orchestrator,/personalRejectedSourceIds\.includes\(clean\(source\.recommendation_id\)\)/);
 assert.match(orchestrator,/recs\.filter\(validPersonalSource\)/);
});
