import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function pathLines(yaml){
  return yaml.split(/\r?\n/).filter(line=>/^\s+-\s+'.+'\s*$/.test(line)).map(line=>line.trim());
}

test('specialist revenue workflows never fan out on every Supabase migration',()=>{
  const revenue=readFileSync('.github/workflows/revenue-learning.yml','utf8');
  const linkedin=readFileSync('.github/workflows/linkedin-revenue-cockpit-tests.yml','utf8');

  assert.doesNotMatch(revenue,/supabase\/migrations\/\*\*/);
  assert.doesNotMatch(linkedin,/supabase\/migrations\/\*\*/);

  assert.match(revenue,/supabase\/migrations\/\*revenue\*\.sql/);
  assert.match(revenue,/supabase\/migrations\/\*growth\*\.sql/);
  assert.match(linkedin,/supabase\/migrations\/\*linkedin\*\.sql/);
  assert.match(linkedin,/supabase\/migrations\/\*revenue\*\.sql/);
});

test('revenue learning trigger list contains no duplicate path entries',()=>{
  const revenue=readFileSync('.github/workflows/revenue-learning.yml','utf8');
  const lines=pathLines(revenue);
  const pullStart=lines.indexOf("- 'netlify/functions/_revenue-learning-*.mjs'");
  assert.ok(pullStart>=0);
  const duplicateCounts=new Map();
  for(const line of lines) duplicateCounts.set(line,(duplicateCounts.get(line)||0)+1);
  // pull_request and push intentionally repeat the same scoped paths once each.
  for(const [line,count] of duplicateCounts){
    assert.ok(count<=2, `unexpected duplicate trigger entry: ${line} x${count}`);
  }
});

test('specialist workflows retain bounded concurrency cancellation',()=>{
  for(const path of ['.github/workflows/revenue-learning.yml','.github/workflows/linkedin-revenue-cockpit-tests.yml']){
    const yaml=readFileSync(path,'utf8');
    assert.match(yaml,/concurrency:/);
    assert.match(yaml,/cancel-in-progress:\s*true/);
  }
});
