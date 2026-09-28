import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read=(p)=>readFile(new URL('../'+p, import.meta.url),'utf8');

test('SEO inspection cannot be used as an advice-only stop condition', async()=>{
  const [skill,learning,doc,ledger]=await Promise.all([
    read('.agents/skills/seo-revenue-growth/SKILL.md'),
    read('brain/learning/2026-09-28-seo-autonomous-inspect-then-act-v1.json'),
    read('docs/changes/2026-09-28-seo-autonomous-inspect-then-act-v1.md'),
    read('docs/development-ledger-events/2026-09-28-seo-autonomous-inspect-then-act-v1.md')
  ]);
  const l=JSON.parse(learning);
  assert.equal(l.failure_class,'INSPECTION_USED_AS_STOP_CONDITION');
  for(const token of ['Repository inspection is a prerequisite to execution, never a reason to stop','inspect current `main`','create exactly one candidate lineage','REJECTED_WITH_EVIDENCE']) assert.ok(skill.includes(token),token);
  assert.ok(skill.includes('Do not return “I did not create a candidate because repository state/owner/lineage first needed inspection.”'));
  assert.ok(doc.includes('not valid reasons to stop'));
  assert.ok(ledger.includes('Tool/CI errors are recovery work'));
});
