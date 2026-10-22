import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=relative=>readFile(new URL(relative,root),'utf8');
test('existing canonical scan edge is explicitly declared for provider attestation',async()=>{
  const config=await read('supabase/config.toml');
  const blocks=[...config.matchAll(/^\[functions\.powerhouse-scan-ingest\]\s*\n([\s\S]*?)(?=^\[|$(?![\s\S]))/gm)];
  assert.equal(blocks.length,1,'one canonical scan Edge declaration');
  const block=blocks[0][1];
  assert.match(block,/^enabled = true$/m);
  assert.match(block,/^verify_jwt = false$/m);
  assert.match(block,/^entrypoint = "\.\/functions\/powerhouse-scan-ingest\/index\.ts"$/m);
});
test('JWT opt-out is retained only with validated custom service authentication',async()=>{
  const edge=await read('supabase/functions/powerhouse-scan-ingest/index.ts');
  const publicProxy=await read('netlify/functions/powerhouse-scan-ingest.mjs');
  const portalProxy=await read('netlify/functions/portal-scans.mjs');
  assert.match(edge,/req\.headers\.get\('x-bg-service-token'\)/);
  assert.match(edge,/sha256\(token\)!==TOKEN_HASH/);
  assert.match(edge,/return json\(\{error:'UNAUTHORIZED'\},401\)/);
  assert.match(publicProxy,/PRIVILEGED_ACTION_FORBIDDEN/);
  assert.match(portalProxy,/getUser\(\)/);
  assert.match(portalProxy,/resolveIdentityTenant\(user\)/);
});
test('configuration references the exact existing Edge source with Bedrijfslek',async()=>{
  const edge=await read('supabase/functions/powerhouse-scan-ingest/index.ts');
  assert.match(edge,/isBedrijfslek/);
  assert.match(edge,/website\.bedrijfslek/);
  assert.match(edge,/powerhouse_runtime_events/);
  assert.match(edge,/scan_inzendingen/);
});
