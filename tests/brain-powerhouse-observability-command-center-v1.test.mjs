import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mapRuntimeProjection } from '../portal-v2/runtime-evidence.js';

test('observability projection normalizes agent, delivery, error and skill evidence without inventing data',()=>{
  const runtime=mapRuntimeProjection({
    records:[
      {id:'e1',type:'github_workflow',title:'Required test',status:'success',actor:'agent-a',source:'GitHub',occurredAt:'2026-09-20T08:00:00Z'},
      {id:'e2',type:'skill_projection',title:'Powerhouse Skill Projection',status:'success',actor:'brain',source:'GitHub',occurredAt:'2026-09-20T08:01:00Z'},
      {id:'e3',type:'runtime_error',title:'Provider 429',status:'BLOCKED',actor:'publisher',source:'Buffer',fingerprint:'buffer-429',occurredAt:'2026-09-20T08:02:00Z'}
    ],
    executiveCockpit:{activityTimeline:[]},
    integrationHealth:{components:[{name:'Supabase',healthy:true}]},
    livingMemory:{memories:[]},
    verifiedValue:{verifiedValues:[]},
    wholeBrainLoops:[],
    loopSummary:{total:0,complete:0,incomplete:0},
    priorityPortfolio:{},
    actors:{}
  });
  assert.equal(runtime.observability.events.length,3);
  assert.equal(runtime.observability.events.find(x=>x.id==='e1').layer,'GitHub / Delivery');
  assert.equal(runtime.observability.events.find(x=>x.id==='e2').category,'skill');
  assert.equal(runtime.observability.events.find(x=>x.id==='e3').category,'error');
  assert.equal(runtime.observability.events.find(x=>x.id==='e3').fingerprint,'buffer-429');
  assert.equal(runtime.observability.components[0].name,'Supabase');
});

test('Powerhouse Control Center is wired into the native Portal V2 registry and shell',async()=>{
  const [registry,shell,hubs,module,css]=await Promise.all([
    readFile('portal-v2/page-registry.js','utf8'),
    readFile('portal-v2/page-shell.js','utf8'),
    readFile('portal-v2/hubs.js','utf8'),
    readFile('portal-v2/modules/powerhouse-observability.js','utf8'),
    readFile('portal-v2/powerhouse-observability.css','utf8')
  ]);
  assert.match(registry,/powerhouse-control-center/);
  assert.match(hubs,/powerhouse-control-center/);
  assert.match(shell,/mountPowerhouseObservability/);
  assert.match(shell,/powerhouse-observability\.css/);
  assert.match(module,/Alles wat AI, agents, chats en delivery doen/);
  assert.match(module,/Errors & herstel/);
  assert.match(module,/Documentatie & learning/);
  assert.match(module,/Skills/);
  assert.match(css,/\.poc-filters/);
});

test('cockpit keeps the canonical runtime truth boundary explicit',async()=>{
  const module=await readFile('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(module,/Geen runtime-evidence = geen verzonnen status/);
  assert.match(module,/Runtime gekoppeld/);
  assert.match(module,/Geen runtimebewijs/);
});
