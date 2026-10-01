import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public conversion tools own explicit clean Netlify routes',()=>{
  const redirects=readFileSync('_redirects','utf8');
  assert.match(redirects,/^\/pakketadvies\s+\/pakketadvies\.html\s+200$/m);
  assert.match(redirects,/^\/portaal-demo\s+\/portaal-demo\.html\s+200$/m);
});

test('public tool route targets exist with canonical clean URLs',()=>{
  const advisor=readFileSync('pakketadvies.html','utf8');
  const demo=readFileSync('portaal-demo.html','utf8');
  assert.match(advisor,/rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/pakketadvies"/);
  assert.match(demo,/rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/portaal-demo"/);
});
