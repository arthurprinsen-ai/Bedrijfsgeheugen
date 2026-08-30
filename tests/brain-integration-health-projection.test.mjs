import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { projectIntegrationHealth } from '../brain/operating-loop/integration-health.mjs';
import { createOperatingLoopStore } from '../brain/operating-loop/store.mjs';

const mappings = JSON.parse(await readFile('config/brain-source-mappings.json','utf8'));

const currentState = ({id,platform,component,observedAt,health='healthy',capacity='available',execution_status='ready',cost=0,revision='r1',error=null}) => ({
  schemaVersion:'brain-record.v1',tenantId:'tenant-a',type:'CurrentState',kind:'current_state',id,subjectId:`integration:${platform}:${component}`,owner:'agent-reliability',status:'OBSERVED',observedAt,executed:false,verified:true,result:null,evidenceIds:[],references:[],
  payload:{integration:{platform,component,health,freshness:observedAt,error,owner:'agent-reliability',cost,revision,capacity,execution_status,last_verified_at:observedAt}},
  provenance:{source:platform,sourceId:id},graph:{nodes:[],edges:[]}
});

test('all external platform mappings may emit canonical CurrentState telemetry', () => {
  assert.ok(mappings.allowed_canonical_types.includes('CurrentState'));
  for (const platform of ['github','netlify','make','notion','supabase','dataforseo']) {
    assert.ok(mappings.sources[platform].canonical_types.includes('CurrentState'), `${platform} cannot emit CurrentState`);
  }
});

test('integration health keeps latest record per platform/component and exposes cockpit fields', () => {
  const records=[
    currentState({id:'a1',platform:'make',component:'BG139',observedAt:'2026-08-30T10:00:00Z',health:'healthy',cost:10}),
    currentState({id:'a2',platform:'make',component:'BG139',observedAt:'2026-08-30T11:00:00Z',health:'degraded',capacity:'quota_exceeded',execution_status:'blocked',cost:12,error:'quota'}),
    currentState({id:'b1',platform:'github',component:'Bedrijfsgeheugen',observedAt:'2026-08-30T11:05:00Z',revision:'abc123'})
  ];
  const projection=projectIntegrationHealth(records);
  assert.equal(projection.schemaVersion,'brain-integration-health.v1');
  assert.equal(projection.components.length,2);
  const make=projection.components.find(x=>x.platform==='make');
  assert.equal(make.health,'degraded');
  assert.equal(make.capacity,'quota_exceeded');
  assert.equal(make.execution_status,'blocked');
  assert.equal(make.cost,12);
  assert.equal(projection.summary.blocked,1);
});

test('operating-loop projection exposes integrationHealth for executive cockpit', async () => {
  const rows=[currentState({id:'g1',platform:'github',component:'Bedrijfsgeheugen',observedAt:'2026-08-30T11:05:00Z'})];
  const adapter={get:async()=>null,put:async()=>{},list:async()=>rows.map(record=>({value:{record}}))};
  const store=createOperatingLoopStore(adapter);
  const projection=await store.getProjection('tenant-a');
  assert.equal(projection.integrationHealth.schemaVersion,'brain-integration-health.v1');
  assert.equal(projection.integrationHealth.components[0].platform,'github');
});
