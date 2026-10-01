import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('package advisor and portal demo have explicit clean routes',()=>{
  const redirects=readFileSync('_redirects','utf8');
  assert.match(redirects,/^\/pakketadvies\s+\/pakketadvies\.html\s+200$/m);
  assert.match(redirects,/^\/portaal-demo\s+\/portaal-demo\.html\s+200$/m);
});

test('clean route targets exist and keep canonical URLs',()=>{
  const advisor=readFileSync('pakketadvies.html','utf8');
  const demo=readFileSync('portaal-demo.html','utf8');
  assert.match(advisor,/rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/pakketadvies"/);
  assert.match(demo,/rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/portaal-demo"/);
});
