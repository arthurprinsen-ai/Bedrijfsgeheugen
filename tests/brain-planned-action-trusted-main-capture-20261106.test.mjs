import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relative => readFile(new URL('../' + relative, import.meta.url),'utf8');

test('the original PR candidate planner sees real action but never receives Supabase privileged secrets',async()=>{
  const workflow=await read('.github/workflows/unified-brain-delivery.yml');
  const planStep=workflow.split('      - name: Reuse proven delivery lessons before expensive work')[1]?.split('      - id: plan')[0];
  assert.ok(planStep?.includes('node tools/delivery-preflight.mjs shared --action'));
  assert.match(planStep,/POWERHOUSE_AGENT_ID: brain-delivery-plan/);
  assert.ok(!/secrets\.|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_URL/.test(planStep),'candidate PR cannot receive BRAIN secret');
});

test('existing trusted-main agents perform original preflight before work and only main sees credentials',async()=>{
  for(const [path,agent] of [
    ['.github/workflows/main-write-integrity.yml','main-write-integrity'],
    ['.github/workflows/production-release-readback.yml','production-release-readback'],
  ]){
    const source=await read(path);
    const begin=source.indexOf('      - name: Observe genuine protected-main');
    assert.ok(begin>=0,path);
    const step=source.slice(begin,source.indexOf('      - ',begin+1));
    assert.match(step,/if: github\.ref == 'refs\/heads\/main'/);
    assert.ok(step.includes('POWERHOUSE_AGENT_ID: '+agent));
    assert.match(step,/POWERHOUSE_ACTION_RECALL_MODE: auto/);
    assert.match(step,/node tools\/delivery-preflight\.mjs shared --action/);
    assert.match(step,/secrets\.(?:BG_PORTAL_EU_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY)/);
    assert.ok(source.indexOf('uses: actions/checkout') < begin,'trusted branch checkout before secret-bearing action');
  }
});

test('canonical recorder can only append existing RPC with independent readback',async()=>{
  const source=await read('brain/observability/planned-action-live-recorder.mjs');
  assert.match(source,/brain_append_record/);
  assert.match(source,/createSupabaseRecordAdapter/);
  assert.match(source,/PLANNED_ACTION_BRAIN_READBACK_MISMATCH/);
  assert.ok(!source.includes('cron.schedule')&&!source.includes('create table'),'must use original source and scheduler');
  const preflight=await read('tools/delivery-preflight.mjs');
  const event=preflight.indexOf('await recordPlannedAction(');
  const deny=preflight.indexOf("throw new Error('PLANNED_ACTION_PREVENTION_REQUIRED:");
  assert.ok(event>0&&deny>event,'record blocked actions before fail-closed decision');
});
