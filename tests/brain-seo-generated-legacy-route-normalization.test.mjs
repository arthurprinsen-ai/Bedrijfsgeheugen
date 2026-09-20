import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('.github/scripts/seocontrole.py','utf8');
test('SEO audit excludes generated legacy routes absent from canonical source',()=>{
  for(const route of ['meer','oplossingen','prototype-v18-stable']) assert.match(s,new RegExp("OVERSLAAN = \\{[^\\n]*'"+route+"'"));
});