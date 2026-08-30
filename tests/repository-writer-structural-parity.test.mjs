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
  'weekblog':'.github/workflows/weekblog.yml',
};

test('all seven governed writers are candidate-only and cannot self-promote',()=>{
  for(const [name,p] of Object.entries(writers)){
    const w=fs.readFileSync(p,'utf8');
    assert.match(w,/candidate-pr/,`${name}: candidate mode required`);
    assert.match(w,/createWriterCandidate/,`${name}: canonical candidate required`);
    assert.match(w,/gh pr create/,`${name}: candidate PR required`);
    assert.doesNotMatch(w,/git\s+push\s+origin\s+HEAD:main/,`${name}: direct main forbidden`);
    assert.doesNotMatch(w,/gh\s+pr\s+merge/,`${name}: self merge forbidden`);
  }
});
