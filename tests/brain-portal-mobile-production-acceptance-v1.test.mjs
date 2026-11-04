import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('portal mobile production evidence and human acceptance boundary remain explicit',()=>{
 const learning=JSON.parse(fs.readFileSync('brain/learning/2026-11-04-portal-mobile-production-acceptance-v1.json','utf8'));
 const skill=fs.readFileSync('.agents/skills/portal-living-interface/SKILL.md','utf8');
 const doc=fs.readFileSync('docs/development-ledger-events/2026-11-04-portal-mobile-production-acceptance.md','utf8');
 assert.equal(learning.evidence.production_sha,'4d5823446c3b830e9b33b0314893cdd56dc5b5ee');
 assert.equal(learning.evidence.github_run,41895447111);
 assert.equal(learning.status,'TECHNICAL_PRODUCTION_VERIFIED_HUMAN_USABILITY_OPEN');
 assert.equal(learning.open_obligations.length,3);
 assert.match(skill,/original Portal V2-owner|oorspronkelijke Portal V2-owner/i);
 assert.match(skill,/VoiceOver\/TalkBack/);
 assert.match(doc,/HUMAN_USABILITY_OPEN/);
});
