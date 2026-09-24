import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const skill=fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');
const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

test('expired Netlify proxy is treated as deploy-auth hard boundary',()=>{
  assert.match(skill,/netlify-vault-proxy-expiry-hard-boundary-20260924-v1/);
  assert.match(skill,/401 Unauthorized/i);
  assert.match(skill,/linked[_ -]?build.*ok=false/i);
  assert.match(skill,/do not mutate website or application code/i);
  assert.match(skill,/LIVE_BEWEZEN/);
  assert.match(workflow,/Acquire Netlify deploy transport through GitHub OIDC/);
  assert.match(workflow,/Fail fast on Netlify provider build error/);
});
