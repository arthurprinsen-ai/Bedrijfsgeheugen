import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const writers={
 'approved-central-blog':'.github/workflows/approved-central-blog.yml',
 'blog-bijwerken':'.github/workflows/blog-bijwerken.yml',
 'menu-balk-fix':'.github/workflows/menu-balk-fix.yml',
 'paginacontrole':'.github/workflows/paginacontrole.yml',
 'regelgeving-bijwerken':'.github/workflows/regelgeving-bijwerken.yml',
 'seo-controle':'.github/workflows/seo-controle.yml',
 'weekblog':'.github/workflows/weekblog.yml'
};
const rows=Object.entries(writers).map(([name,path])=>[name,fs.readFileSync(path,'utf8')]);
test('all seven governed writers are BRAIN v2 candidate-only',()=>{for(const [name,text] of rows){assert.match(text,/candidate-pr/,name);assert.match(text,/createWriterCandidate/,name);assert.match(text,/gh\s+pr\s+create/,name);assert.doesNotMatch(text,/default:\s*direct/,name);assert.doesNotMatch(text,/git push origin HEAD:main/,name);assert.doesNotMatch(text,/DELIVERY_MODE" = "direct/,name);assert.doesNotMatch(text,/gh\s+pr\s+merge/,name);}});
test('all writer production completion stays behind central promotion proof',()=>{for(const [name,text] of rows){assert.doesNotMatch(text,/steps\.[^\n]*delivery == 'direct'/,name);}});
