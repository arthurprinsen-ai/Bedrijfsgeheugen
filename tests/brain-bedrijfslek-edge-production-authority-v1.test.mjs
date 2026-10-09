import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('canonical production authority explicitly declares existing scan Edge entrypoint',async()=>{
  const config=await readFile(new URL('../supabase/config.toml',import.meta.url),'utf8');
  const sections=[...config.matchAll(/^\[functions\.powerhouse-scan-ingest\]$/gm)];
  assert.equal(sections.length,1,'No duplicate scan Edge declarations');
  const block=config.split('[functions.powerhouse-scan-ingest]')[1]?.split(/\n\[/)[0]||'';
  assert.match(block,/enabled\s*=\s*true/);
  assert.match(block,/verify_jwt\s*=\s*false/);
  assert.match(block,/entrypoint\s*=\s*"\.\/functions\/powerhouse-scan-ingest\/index\.ts"/);
});
test('JWT exception depends on actual private hashed service token and blocked privilege proxy',async()=>{
  const edge=await readFile(new URL('../supabase/functions/powerhouse-scan-ingest/index.ts',import.meta.url),'utf8');
  const proxy=await readFile(new URL('../netlify/functions/powerhouse-scan-ingest.mjs',import.meta.url),'utf8');
  assert.match(edge,/req\.headers\.get\('x-bg-service-token'\)/);
  assert.match(edge,/await sha256\(token\)!==TOKEN_HASH/);
  assert.match(edge,/return json\(\{error:'UNAUTHORIZED'\},401\)/);
  assert.match(proxy,/BG_PORTAL_EU_SERVICE_TOKEN/);
  assert.match(proxy,/PRIVILEGED_ACTION_FORBIDDEN/);
  assert.match(proxy,/body\?\.action==='history'/);
  assert.match(proxy,/body\?\.action==='claim'/);
  assert.match(proxy,/scan-public-proxy-v2/);
});

test('postmerge production scan workflow proves Bedrijfslek itself, without a new sender',async()=>{
  const workflow=await readFile(new URL('../.github/workflows/powerhouse-scan-production-proof.yml',import.meta.url),'utf8');
  assert.match(workflow,/supabase\/config\.toml/);
  assert.match(workflow,/name: Prove real Bedrijfslek/);
  assert.match(workflow,/canonical:"https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
  assert.match(workflow,/source_kind:"bedrijfslek_scan"/);
  assert.match(workflow,/deduped == true/);
  assert.match(workflow,/bedrijfslek_event_id=/);
});
