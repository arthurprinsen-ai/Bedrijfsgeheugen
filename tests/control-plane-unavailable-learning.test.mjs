import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const shard=JSON.parse(fs.readFileSync('config/chat-learning/2026-08-30-control-plane-unavailable.json','utf8'));
const rules=JSON.parse(fs.readFileSync('config/delivery-prevention-rules.json','utf8'));
test('control-plane outage learning is durable and governed',()=>{const lesson=shard.lessons.find(x=>x.id==='CONTROL_PLANE_UNAVAILABLE_PRESERVE_CANDIDATE');assert.ok(lesson);assert.equal(lesson.preventionRule,'PRESERVE_GREEN_CANDIDATE_WHEN_PRODUCTION_AUTHORITY_UNAVAILABLE');assert.match(lesson.requiredAction,/dezelfde.*SHA|same.*SHA/i);assert.match(lesson.prevention,/niet omzeilen|not bypass/i);const rule=rules.rules.find(x=>x.id===lesson.preventionRule);assert.ok(rule?.active===true)});
