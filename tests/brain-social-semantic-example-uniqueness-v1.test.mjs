import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const personal=fs.readFileSync('.agents/skills/personal-linkedin-life-only/SKILL.md','utf8');
const linkedin=fs.readFileSync('.agents/skills/linkedin-composio-publisher/SKILL.md','utf8');
const instagram=fs.readFileSync('.agents/skills/instagram-composio-publisher/SKILL.md','utf8');
const agents=fs.readFileSync('AGENTS.md','utf8');
const map=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('semantic example reuse is forbidden across social publication surfaces',()=>{
  for (const text of [personal,linkedin,instagram,agents,map]) {
    assert.match(text,/powerhouse-global-semantic-example-uniqueness-v4|personal-linkedin-semantic-example-uniqueness-v1/);
  }
  assert.match(personal,/printer/);
  assert.match(linkedin,/never paraphrase|never.*paraphras/i);
  assert.match(agents,/underlying subject, concrete example, incident or story family/i);
  assert.match(map,/knownRetiredExamples:Object\.freeze\(\['printer'\]\)/);
});

test('personal source rotation cannot authorize previously published examples',()=>{
  assert.match(personal,/never rotate back to a least-recently-used source/i);
  assert.match(personal,/do not recycle old examples/i);
});
