import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const lessons=JSON.parse(fs.readFileSync('docs/brain/delivery-failure-lessons.json','utf8')).lessons;
const rules=JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8')).rules;

const requiredFields=['fingerprint','stage','component','reason','rootCause','fix','preventionRule','status'];
const newChatLearnings=[
  ['delivery-failure|verification|shared|http-ack-without-execution-proof','REQUIRE_EXECUTION_PROOF_AFTER_HTTP_ACK'],
  ['delivery-failure|capacity|automation|make-quota-paused-production-handoff','BLOCK_PROMOTION_WHEN_PLATFORM_CAPACITY_UNAVAILABLE'],
  ['delivery-failure|cost|automation|client-cache-without-source-call-reduction','OPTIMIZE_SOURCE_CALLS_NOT_ONLY_CLIENT_CACHE'],
  ['delivery-failure|governance|shared|write-used-as-branch-existence-probe','NEVER_MUTATE_TO_DISCOVER_BRANCH_STATE']
];

test('every delivery lesson is complete, proven, unique and backed by an active prevention rule',()=>{
  const seen=new Set();
  for(const lesson of lessons){
    for(const field of requiredFields){
      assert.ok(String(lesson[field]??'').trim(),`lesson ${lesson.fingerprint||'<missing>'} missing ${field}`);
    }
    assert.equal(lesson.status,'PROVEN',`${lesson.fingerprint} must be PROVEN`);
    assert.equal(seen.has(lesson.fingerprint),false,`duplicate lesson fingerprint ${lesson.fingerprint}`);
    seen.add(lesson.fingerprint);
    const rule=rules.find(rule=>rule.id===lesson.preventionRule);
    assert.ok(rule,`missing prevention rule ${lesson.preventionRule}`);
    assert.equal(rule.active,true,`${lesson.preventionRule} must be active`);
    assert.ok(String(rule.enforcedBy||'').trim(),`${lesson.preventionRule} must name enforcement`);
  }
});

test('critical chat learnings are permanently captured as executable prevention rules',()=>{
  for(const [fingerprint,ruleId] of newChatLearnings){
    const lesson=lessons.find(item=>item.fingerprint===fingerprint);
    assert.ok(lesson,`missing chat lesson ${fingerprint}`);
    assert.equal(lesson.preventionRule,ruleId);
    const rule=rules.find(item=>item.id===ruleId);
    assert.ok(rule,`missing chat prevention rule ${ruleId}`);
    assert.equal(rule.active,true);
  }
});
