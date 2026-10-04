import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const impact=fs.readFileSync('portal-v2/csrd-impact.css','utf8');
const mobile=fs.readFileSync('portal-v2/csrd-mobile-saas.css','utf8');
const app=fs.readFileSync('portal-v2/app.css','utf8');
const contract=JSON.parse(fs.readFileSync('config/powerhouse-portal-visual-assurance-v1.json','utf8'));

test('portal visuals have explicit density caps',()=>{
  assert.match(impact,/\.csrd-world\{[^}]*min-height:300px;max-height:340px/);
  assert.match(impact,/\.csrd-meter-ring\{width:108px/);
  assert.doesNotMatch(impact,/\.csrd-world\{[^}]*min-height:390px/);
  assert.match(mobile,/\.csrd-world\{min-height:300px;max-height:320px/);
  assert.doesNotMatch(mobile,/min-height:420px/);
  assert.match(app,/\.core\{height:245px/);
  assert.match(app,/\.brainimg\{position:absolute;top:8px;width:160px;height:90px/);
  assert.match(app,/@media\(max-width:760px\)[\s\S]*?\.core\{height:250px\}/);
  assert.doesNotMatch(app,/\.core\{height:310px/);
});

test('canonical visual assurance contract spans GitHub Supabase and Notion',()=>{
  assert.equal(contract.loop_key,'portal-visual-density');
  assert.equal(contract.authority.supabase_registry,'public.powerhouse_loop_assurance_registry_v1');
  assert.equal(contract.authority.notion_state,'Portal V2 visual regression — canonical route authority');
  assert.deepEqual(contract.stages,['input','decision','action','readback','outcome','measurement','learning','guard']);
  assert.equal(contract.routes.length,6);
  assert.equal(contract.viewports.length,4);
  assert.equal(contract.routes.length*contract.viewports.length,24);
  assert.equal(contract.thresholds.mobile_csrd_world_must_be_hidden,true);
  assert.equal(contract.thresholds.critical_touch_target_px,44);
  assert.equal(contract.viewports.find(v=>v.id==='narrow-mobile').width,320);
});

test('visual regression harness is config-driven and emits assurance evidence',()=>{
  const harness=fs.readFileSync('tools/portal-visual-density.mjs','utf8');
  for(const marker of ['powerhouse-portal-visual-assurance-v1.json','contract.routes','contract.viewports','contract.thresholds','page.screenshot','assurance.json','loop_key','data-portal-visual-overflow','experienceReady','undersized']) assert.ok(harness.includes(marker),marker);
});

test('GitHub runs production visual assurance every day',()=>{
  const workflow=fs.readFileSync('.github/workflows/portal-visual-density.yml','utf8');
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/cron: '45 5 \* \* \*'/);
  assert.match(workflow,/https:\/\/www\.bedrijfsgeheugen\.nl/);
  assert.match(workflow,/retention-days: 30/);
});
