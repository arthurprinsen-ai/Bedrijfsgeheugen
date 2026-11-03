import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {declaredFunctions,resolveEdgeRuntimeFunctions} from '../tools/supabase/edge-runtime-scope.mjs';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('supabase/functions/bg-kansenradar/index.ts');
const config=read('supabase/config.toml');
const migration=read('supabase/migrations/20261103124000_bg_kansenradar_original_cron_authorization.sql');
test('one existing Kansenradar v12 function is declared in the protected main manifest',()=>{
  assert.ok(declaredFunctions(config).includes('bg-kansenradar'));
  assert.match(config,/\[functions\.bg-kansenradar\]\s*enabled\s*=\s*true\s*verify_jwt\s*=\s*false\s*entrypoint\s*=\s*"\.\/functions\/bg-kansenradar\/index\.ts"/);
  assert.deepEqual(resolveEdgeRuntimeFunctions({changedPaths:['supabase/functions/bg-kansenradar/index.ts'],configText:config}),['bg-kansenradar']);
});
test('native scheduler credential is required before service role / AI / Notion side effects',()=>{
  const server=source.slice(source.indexOf('Deno.serve('));
  assert.match(server,/if \(req\.method !== 'POST'\)/);
  const secret=server.indexOf("p_naam: 'powerhouse_daily_scheduler_token'");
  const supplied=server.indexOf("req.headers.get('x-powerhouse-token')");
  const rejection=server.indexOf("error: 'UNAUTHORIZED'");
  const proof=server.indexOf("const bewijs =");
  const governance=server.indexOf("from('brain_ai_governance_registry')");
  const notion=server.indexOf("https://api.notion.com/v1/pages");
  assert.ok(secret>0&&supplied>secret&&rejection>supplied);
  assert.ok(proof>rejection&&governance>rejection&&notion>rejection);
  assert.match(server,/!schedulerSecret \|\| callerToken\.length < 16 \|\| callerToken !== schedulerSecret/);
  assert.doesNotMatch(server,/if \(!schedulerSecret\) \{\s*return json\(\{ ok: true/);
});
test('canonical migration updates the same job and never creates new schedule or embeds token',()=>{
  assert.match(migration,/jobname = 'bg-kansenradar-dagelijks'/);
  assert.match(migration,/count\(\*\) FROM cron\.job/);
  assert.match(migration,/cron\.alter_job\(job_id := v_id, command := v_authorized, active := true\)/);
  assert.match(migration,/public\.bg_geheim\('powerhouse_daily_scheduler_token'\)/);
  assert.match(migration,/BG_KANSENRADAR_ORIGINAL_CRON_DRIFT_REFUSE_OVERWRITE/);
  assert.doesNotMatch(migration,/cron\.(?:schedule|unschedule)\(/);
  assert.doesNotMatch(migration,/(?:Bearer|api[_-]?key)\s+[A-Za-z0-9_\-]{15,}/i);
  assert.match(migration,/IF v_current = v_authorized THEN\s*RETURN/);
});
