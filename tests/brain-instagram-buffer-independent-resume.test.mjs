import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('netlify/functions/social-publication-delivery.mjs','utf8');
test('Instagram canonical publisher runs before any Buffer read',()=>{
  const canonical=s.indexOf("const canonical = await triggerCanonicalPublisher(local.date)");
  const buffer=s.indexOf("posts = await getProviderPosts(local.date)");
  assert.ok(canonical>=0&&buffer>canonical);
});
test('Buffer outage defers LinkedIn without blocking Instagram',()=>{
  assert.match(s,/channel === 'instagram'[\s\S]*buffer_independent:true/);
  assert.match(s,/DEFERRED_PROVIDER_UNAVAILABLE/);
  assert.match(s,/return \{ ok:true, date:local\.date, results, bufferUnavailable \}/);
});
