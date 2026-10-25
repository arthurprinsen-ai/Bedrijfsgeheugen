import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("agents and continuity skill preserve growth proof requirements",()=>{
 const agent=read("AGENTS.md"),skill=read(".agents/skills/powerhouse-continuity/SKILL.md");
 for(const rule of ["createCustomerSignalCards","tenantId","Required","CodeQL","readback","merge_queue"]){
  assert.ok(agent.includes(rule),"AGENTS missing "+rule);
  assert.ok(skill.includes(rule),"skill missing "+rule);
 }
 const learning=JSON.parse(read("brain/learning/2026-10-25-growth-skill-proof-contract.json"));
 assert.equal(learning.status,"RELEASE_CANDIDATE");
 assert.ok(learning.guardrails.includes("independent-payment-proof"));
});
