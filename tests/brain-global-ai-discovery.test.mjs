import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const shell=readFileSync('over-ons.html','utf8');
const header=readFileSync('components/header/header.html','utf8');
const footer=readFileSync('components/footer/footer.html','utf8');
const redirects=readFileSync('_redirects','utf8');

test('canonical shell exposes AI model guide and governance on desktop and mobile',()=>{
  for(const href of ['/ai-modelwijzer','/ai-governance']){
    assert.ok((shell.match(new RegExp('href="'+href.replace('/','\\/')+'"','g'))||[]).length >= 2, href+' must be present in desktop/mobile shell navigation');
    assert.ok(header.includes('href="'+href+'"'), href+' must be present in header component');
    assert.ok(footer.includes('href="'+href+'"'), href+' must be present in footer component');
  }
});

test('public conversion rewrites are unique',()=>{
  for(const line of ['/pakketadvies  /pakketadvies.html  200','/portaal-demo  /portaal-demo.html  200']){
    assert.equal(redirects.split('\n').filter(x=>x===line).length,1,line+' must occur exactly once');
  }
});
