import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('pricing rescue runtime cache key matches the exact Git blob identity', async()=>{
  const html=await readFile('prijzen.html','utf8');
  const asset=await readFile('assets/js/pricing-interactions-rescue-v1.js');
  const match=html.match(/pricing-interactions-rescue-v1\.js\?v=([0-9a-f]{12})/);
  assert.ok(match,'pricing rescue runtime must use a 12-hex content-addressed cache key');
  const header=Buffer.from(`blob ${asset.length}\0`);
  const blobSha=createHash('sha1').update(header).update(asset).digest('hex');
  assert.equal(match[1],blobSha.slice(0,12),'pricing rescue cache key must match current JS Git blob identity');
});

test('production snapshot validates the same content-addressed pricing rescue key', async()=>{
  const html=await readFile('prijzen.html','utf8');
  const workflow=await readFile('.github/workflows/production-source-snapshot.yml','utf8');
  const match=html.match(/pricing-interactions-rescue-v1\.js\?v=([0-9a-f]{12})/);
  assert.ok(match);
  assert.match(workflow,new RegExp(`pricing-interactions-rescue-v1\\.js\\?v=${match[1]}`));
});


test('build integrity preserves the same content-addressed pricing rescue key', async()=>{
  const html=await readFile('prijzen.html','utf8');
  const build=await readFile('tools/site-shell/pricing-build-integrity.mjs','utf8');
  const match=html.match(/pricing-interactions-rescue-v1\.js\?v=([0-9a-f]{12})/);
  assert.ok(match);
  assert.match(build,new RegExp(`pricing-interactions-rescue-v1\\.js\\?v=${match[1]}`));
});
