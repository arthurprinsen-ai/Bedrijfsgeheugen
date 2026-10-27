import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const script=path.resolve('scripts/brain/portal-explanation-inventory.mjs');
test('inventory check catches addition, deletion and source changes; refresh is idempotent',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'portal-explanation-'));
  try{
    for(const dir of ['platform/system-map','.agents/skills','platform/agents','netlify/functions','supabase/functions','.github/workflows','portal-v2'])await fs.mkdir(path.join(root,dir),{recursive:true});
    await fs.copyFile('platform/system-map/canonical-system-map.mjs',path.join(root,'platform/system-map/canonical-system-map.mjs'));
    for(const file of ['portal-v2/modules/powerhouse-observability.js','portal-v2/page-registry.js','portal-v2/page-shell.js','portal-v2/page-metrics.js','portal-v2/page-visuals.js','portal-v2/doorwerking.js','portal-v2/legacy-parity-engine.js','portal-v2/runtime-evidence.js','netlify/functions/powerhouse-observability.mjs']){await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),'// fixture');}
    const run=(mode)=>execFileSync(process.execPath,[script,mode,'--root='+root],{encoding:'utf8',stdio:'pipe'});
    assert.throws(()=>run('--check'),/Command failed/);
    run('--write');run('--check');
    const first=await fs.readFile(path.join(root,'platform/system-map/canonical-system-map.mjs'),'utf8');
    run('--write');assert.equal(await fs.readFile(path.join(root,'platform/system-map/canonical-system-map.mjs'),'utf8'),first);
    await fs.writeFile(path.join(root,'.github/workflows/new.yml'),'name: New\n');
    assert.throws(()=>run('--check'));run('--write');run('--check');
    await fs.rm(path.join(root,'.github/workflows/new.yml'));
    assert.throws(()=>run('--check'));run('--write');
    await fs.writeFile(path.join(root,'portal-v2/doorwerking.js'),'export const formula="changed";');
    assert.throws(()=>run('--check'));run('--write');run('--check');
    const map=await import('file://'+path.join(root,'platform/system-map/canonical-system-map.mjs'));
    assert.equal(map.POWERHOUSE_SYSTEM_MAP.providerSnapshot.supabase.tables,255,'repository refresh never fabricates provider database observations');
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
test('existing build, release gate and daily owner enforce explanation freshness',async()=>{
  for(const file of ['tools/ci/netlify-build-entry.mjs','.github/workflows/required-test.yml','.github/workflows/powerhouse-daily-self-evolution.yml'])assert.match(await fs.readFile(file,'utf8'),/portal-explanation-inventory\.mjs/);
});
test('build versions the entry and imported module graph so a week-long browser cache cannot hide updates',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'portal-explanation-assets-'));
  try{
    for(const dir of ['platform/system-map','.agents/skills','platform/agents','netlify/functions','supabase/functions','.github/workflows','portal-v2/modules'])await fs.mkdir(path.join(root,dir),{recursive:true});
    await fs.copyFile('platform/system-map/canonical-system-map.mjs',path.join(root,'platform/system-map/canonical-system-map.mjs'));
    for(const file of ['portal-v2/modules/powerhouse-observability.js','portal-v2/page-registry.js','portal-v2/page-shell.js','portal-v2/page-metrics.js','portal-v2/page-visuals.js','portal-v2/doorwerking.js','portal-v2/legacy-parity-engine.js','portal-v2/runtime-evidence.js','netlify/functions/powerhouse-observability.mjs'])await fs.writeFile(path.join(root,file),'// fixture');
    await fs.writeFile(path.join(root,'portal-v2/index.html'),'<script type="module" src="./app.js"></script>');
    await fs.writeFile(path.join(root,'portal-v2/app.js'),"import {x} from './page-shell.js';\nconst y=import('./modules/powerhouse-observability.js?v=existing');");
    const run=(...args)=>execFileSync(process.execPath,[script,...args,'--root='+root],{stdio:'pipe'});
    run('--write','--stamp-assets');
    const entry=await fs.readFile(path.join(root,'portal-v2/index.html'),'utf8');
    assert.match(entry,/app\.js\?bg_explain=[a-f0-9]{64}/);
    const app=await fs.readFile(path.join(root,'portal-v2/app.js'),'utf8');
    assert.match(app,/page-shell\.js\?bg_explain=[a-f0-9]{64}/);
    assert.match(app,/\?v=existing&bg_explain=[a-f0-9]{64}/);
    run('--check');run('--write','--stamp-assets');
    assert.equal(await fs.readFile(path.join(root,'portal-v2/app.js'),'utf8'),app);
    await fs.appendFile(path.join(root,'portal-v2/doorwerking.js'),'\n// new formula');
    run('--write','--stamp-assets');
    assert.notEqual(await fs.readFile(path.join(root,'portal-v2/index.html'),'utf8'),entry);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
