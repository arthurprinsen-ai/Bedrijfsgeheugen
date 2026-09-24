import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('pricing lifecycle tabs remain directly visible on mobile',()=>{
  const html=fs.readFileSync('prijzen.html','utf8');
  assert.match(html,/\.bg-lifecycle-tabs\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:8px;overflow:visible/);
  assert.match(html,/\.bg-lifecycle-tabs button\{width:100%;min-height:48px;white-space:normal;line-height:1\.2;text-align:center\}/);
  assert.doesNotMatch(html,/\.bg-lifecycle-tabs\{display:flex;overflow-x:auto;overscroll-behavior-inline:contain/);
  for(const stage of ['grow','loss','crisis','buy','sell','portfolio']){
    assert.match(html,new RegExp('data-bg-stage="'+stage+'"'));
  }
});
