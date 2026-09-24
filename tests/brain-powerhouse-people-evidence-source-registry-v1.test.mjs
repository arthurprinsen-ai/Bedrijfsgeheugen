import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sources=JSON.parse(fs.readFileSync("config/powerhouse-people-evidence-sources.json","utf8"));
const detection=JSON.parse(fs.readFileSync("config/powerhouse-people-problem-detection.json","utf8"));

test("people evidence registry is canonical and safety-bounded",()=>{
  assert.equal(detection.source_registry,"config/powerhouse-people-evidence-sources.json");
  assert.ok(Array.isArray(sources.sources) && sources.sources.length >= 10);
  const ids=new Set();
  for(const s of sources.sources){
    assert.ok(s.id && !ids.has(s.id)); ids.add(s.id);
    assert.match(s.url,/^https:\/\//);
    assert.ok(Array.isArray(s.applies_to) && s.applies_to.length>0);
    for(const p of s.applies_to) assert.match(p,/^PH-P0(?:3[1-9]|40)$/);
    assert.ok(["benchmark_context","risk_context","legal_context","policy_context"].includes(s.evidence_role));
    if(s.type==="policy_proposal") assert.equal(s.status,"proposal_not_current_rule");
  }
  assert.equal(detection.external_evidence_policy.role,"benchmark_or_context_only");
  assert.equal(detection.external_evidence_policy.refresh_before_current_claim,true);
});
