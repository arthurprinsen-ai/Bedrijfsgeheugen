import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { POWERHOUSE_SYSTEM_MAP } from '../platform/system-map/canonical-system-map.mjs';

const names=async dir=>(await readdir(dir,{withFileTypes:true}))
  .filter(entry=>entry.isFile()||entry.isDirectory())
  .map(entry=>entry.name)
  .sort();

test('canonical System Map inventory matches repository topology',async()=>{
  const expected=POWERHOUSE_SYSTEM_MAP.inventories;
  assert.deepEqual([...expected.skills].sort(),await names('.agents/skills'));
  assert.deepEqual([...expected.agentFabricModules].sort(),await names('platform/agents'));
  assert.deepEqual([...expected.netlifyFunctions].sort(),await names('netlify/functions'));
  assert.deepEqual([...expected.supabaseFunctions].sort(),await names('supabase/functions'));
  assert.deepEqual([...expected.githubWorkflows].sort(),await names('.github/workflows'));
});

test('System Map contains the four canonical authorities and complete intelligence chain',()=>{
  const ids=new Set(POWERHOUSE_SYSTEM_MAP.sources.map(source=>source.id));
  for(const id of ['github','netlify','supabase','notion']) assert.equal(ids.has(id),true,id);
  const layerIds=new Set(POWERHOUSE_SYSTEM_MAP.intelligenceLayers.map(layer=>layer.id));
  for(const id of ['evidence','knowledge','graph','semantics','signals','prediction','impact','decision','agents','delivery','learning','governance','resource']){
    assert.equal(layerIds.has(id),true,id);
  }
  assert.ok(POWERHOUSE_SYSTEM_MAP.flow.length>=10);
});

test('all future agents are contractually required to register in the live System Map',async()=>{
  const policy=JSON.parse(await readFile('brain/policies/powerhouse-agent-continuity-v1.json','utf8'));
  assert.equal(policy.system_map_registration?.required,true);
  assert.equal(policy.system_map_registration?.machine_manifest,'platform/system-map/canonical-system-map.mjs');
  assert.equal(policy.system_map_registration?.fail_closed_state,'SYSTEM_MAP_WRITEBACK_INCOMPLETE');
  assert.match(policy.system_map_registration?.runtime_actor_rule||'',/actor identity/i);
  assert.match(policy.system_map_registration?.terminal_rule||'',/LIVE_BEWEZEN/);
});

test('admin observability endpoint projects System Map and portal renders it first',async()=>{
  const [api,ui]=await Promise.all([
    readFile('netlify/functions/powerhouse-observability.mjs','utf8'),
    readFile('portal-v2/modules/powerhouse-observability.js','utf8')
  ]);
  assert.match(api,/POWERHOUSE_SYSTEM_MAP/);
  assert.match(api,/systemMap:POWERHOUSE_SYSTEM_MAP/);
  assert.match(ui,/Systeemkaart/);
  assert.match(ui,/systemMapView/);
  assert.match(ui,/tab:'system-map'/);
  assert.match(ui,/Iedere huidige en toekomstige agent/);
});
