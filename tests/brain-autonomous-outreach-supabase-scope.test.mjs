import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {declaredFunctions,resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('autonomous outreach is registered in canonical Supabase function manifest',async()=>{
  const config=await read('supabase/config.toml');
  assert.ok(declaredFunctions(config).includes('powerhouse-autonomous-outreach'));
  assert.match(config,/\[functions\.powerhouse-autonomous-outreach\]\s*enabled\s*=\s*true\s*verify_jwt\s*=\s*false\s*entrypoint\s*=\s*"\.\/functions\/powerhouse-autonomous-outreach\/index\.ts"/);
  assert.deepEqual(resolveEdgeRuntimeFunctions({
    changedPaths:['supabase/functions/powerhouse-autonomous-outreach/index.ts'],
    configText:config
  }),['powerhouse-autonomous-outreach']);
});

test('custom scheduler token guards outbound calls before any email execution',async()=>{
  const source=await read('supabase/functions/powerhouse-autonomous-outreach/index.ts');
  const server=source.slice(source.indexOf('Deno.serve('));
  assert.ok(server.startsWith('Deno.serve('));
  assert.match(server,/req\.method\s*!==\s*'POST'/);
  const authority=server.indexOf("req.headers.get('x-powerhouse-token')");
  const email=server.indexOf("const key=await sec(db,'COMPOSIO_API_KEY')");
  assert.ok(authority>0&&email>authority,'all outbound side effects follow scheduler-token verification');
  assert.match(server,/if\(!token\|\|req\.headers\.get\('x-powerhouse-token'\)!==token\)return J\(\{ok:false,error:'UNAUTHORIZED'\},401\)/);
});
