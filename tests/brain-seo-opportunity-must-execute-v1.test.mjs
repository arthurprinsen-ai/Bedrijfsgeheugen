import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=(p)=>readFile(new URL('../'+p, import.meta.url),'utf8');

test('SEO opportunity loop cannot terminate as advice-only', async()=>{
  const [skill,learning,doc,ledger]=await Promise.all([
    read('.agents/skills/seo-revenue-growth/SKILL.md'),
    read('brain/learning/2026-09-27-seo-opportunity-must-execute-v1.json'),
    read('docs/changes/2026-09-27-seo-opportunity-must-execute-v1.md'),
    read('docs/development-ledger-events/2026-09-27-seo-opportunity-must-execute-v1.md')
  ]);
  const l=JSON.parse(learning);
  assert.equal(l.fingerprint,'seo-opportunity-must-execute-v1');
  assert.equal(l.failure_class,'ADVICE_WITHOUT_EXECUTION');
  for(const token of ['EXECUTED','REJECTED_WITH_EVIDENCE','execution/impact log','production readback','realized revenue']) assert.ok(skill.includes(token),token);
  assert.ok(skill.includes('personal LinkedIn remains outside company-content distribution'));
  assert.ok(doc.includes('EXECUTED') && doc.includes('REJECTED_WITH_EVIDENCE'));
  assert.ok(ledger.includes('query → page → CTA → Frisse blik/scan → lead → offer → order → realized revenue'));
});
