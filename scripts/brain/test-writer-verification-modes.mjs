import fs from 'node:fs';
import assert from 'node:assert/strict';

const regulation=fs.readFileSync('.github/workflows/regelgeving-bijwerken.yml','utf8');
const weekblog=fs.readFileSync('.github/workflows/weekblog.yml','utf8');

for(const [name,text] of [['regelgeving-bijwerken',regulation],['weekblog',weekblog]]){
  assert.match(text,/verification_mode:/,`${name} must expose deterministic verification_mode`);
  assert.match(text,/type:\s*boolean/);
  assert.match(text,/default:\s*false/);
}

assert.match(regulation,/Deterministic verification fixture/);
assert.match(regulation,/inputs\.verification_mode/);
assert.match(regulation,/_verification_canary/);
assert.match(regulation,/ANTHROPIC_API_KEY/);
assert.match(regulation,/if:\s*\$\{\{[^\n]*verification_mode[^\n]*false/);

assert.match(weekblog,/VERIFY_MODE/);
assert.match(weekblog,/writer-verification-weekblog/);
assert.match(weekblog,/Deterministic verification article/);
assert.match(weekblog,/\/tmp\/validated-weekblog-files/);
assert.match(weekblog,/Sleutel controleren[\s\S]*verification_mode[^\n]*false/);
assert.match(weekblog,/Artikel schrijven[\s\S]*verification_mode[^\n]*false/);

console.log('PASS paid/external repository writers have deterministic local verification modes');
