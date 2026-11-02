import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const generator=fileURLToPath(new URL('../scripts/brain/portal-explanation-inventory.mjs',import.meta.url));
const read=(root,path)=>readFileSync(join(root,path),'utf8');
const put=(root,path,data='')=>{const target=join(root,path);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,data)};
const surfaces=[
 'portal-v2/modules/powerhouse-observability.js',
 'portal-v2/page-registry.js','portal-v2/page-shell.js',
 'portal-v2/page-metrics.js','portal-v2/page-visuals.js',
 'portal-v2/doorwerking.js','portal-v2/legacy-parity-engine.js',
 'portal-v2/runtime-evidence.js',
 'netlify/functions/powerhouse-observability.mjs'
];
const directories=['.github/workflows','netlify/functions','supabase/functions','.agents/skills','platform/agents'];
const mapSource="export const POWERHOUSE_SYSTEM_MAP = Object.freeze({\n"+
 "  observedAt:'source',\n"+
 "    githubWorkflows:Object.freeze([]),\n"+
 "    netlifyFunctions:Object.freeze([]),\n"+
 "    supabaseFunctions:Object.freeze([]),\n"+
 "    skills:Object.freeze([]),\n"+
 "    agentFabricModules:Object.freeze([]),\n"+
 "    github:Object.freeze({workflows:0,skills:0,agentFabricModules:0}),\n"+
 "    netlify:Object.freeze({functions:0}),\n"+
 "  explanationInventory:Object.freeze({contract:'portal-explanation-autosync-v1',contentHash:'"+'0'.repeat(64)+"',authority:'repository-source',providerRuntimeVerified:false}),\n"+
 "});\n";
const hashOf=source=>source.match(/contentHash:'([a-f0-9]{64})'/)?.[1];
const entryHash=source=>source.match(/\.\/app\.js\?bg_explain=([a-f0-9]{64})/)?.[1];
const execute=(root,write=false)=>spawnSync(process.execPath,[generator,'--root='+root,...(write?['--write']:[])],{encoding:'utf8'});
test('original System Map writer synchronizes canonical app entry and remains deterministic after changes',()=>{
 const root=mkdtempSync(join(tmpdir(),'brain-portal-cache-contract-'));
 try{
  for(const d of directories)mkdirSync(join(root,d),{recursive:true});
  for(const f of surfaces)put(root,f,'export const same=true;\n');
  put(root,'portal-v2/app.js','export const version=1;\n');
  put(root,'portal-v2/index.html','<html><script type="module" src="./app.js?bg_explain='+'0'.repeat(64)+'"></script><link href="https://www.bedrijfsgeheugen.nl/styles.css" rel="stylesheet"></html>\n');
  put(root,'platform/system-map/canonical-system-map.mjs',mapSource);
  const first=execute(root,true);
  assert.equal(first.status,0,first.stderr);
  const map1=read(root,'platform/system-map/canonical-system-map.mjs');
  const html1=read(root,'portal-v2/index.html');
  assert.match(first.stdout,/PORTAL_EXPLANATION_ENTRY_STAMPED/);
  assert.ok(hashOf(map1));
  assert.equal(entryHash(html1),hashOf(map1));
  assert.match(html1,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/styles\.css"/,'unrelated asset remains unchanged');
  const repeat=execute(root,true);
  assert.equal(repeat.status,0,repeat.stderr);
  assert.equal(read(root,'platform/system-map/canonical-system-map.mjs'),map1);
  assert.equal(read(root,'portal-v2/index.html'),html1);
  put(root,'portal-v2/app.js','export const version=2;\n');
  const stale=execute(root,false);
  assert.notEqual(stale.status,0,'validation cannot silently accept stale source');
  assert.match(stale.stderr,/WRITEBACK_INCOMPLETE|ENTRY_VERSION_DRIFT/);
  assert.equal(read(root,'portal-v2/index.html'),html1,'read-only mode cannot modify protected artifact');
  const corrected=execute(root,true);
  assert.equal(corrected.status,0,corrected.stderr);
  const map2=read(root,'platform/system-map/canonical-system-map.mjs');
  const html2=read(root,'portal-v2/index.html');
  assert.notEqual(hashOf(map1),hashOf(map2));
  assert.equal(entryHash(html2),hashOf(map2));
  assert.equal((html2.match(/\.\/app\.js\?bg_explain=/g)||[]).length,1);
 } finally{rmSync(root,{recursive:true,force:true})}
});
test('original release integrity guard includes Portal entry as tracked fail-closed artifact',()=>{
 const guard=readFileSync(new URL('../tools/delivery/assert-system-map-integrity.mjs',import.meta.url),'utf8');
 assert.match(guard,/const portalEntryPath = 'portal-v2\/index\.html'/);
 assert.match(guard,/mapPath,portalEntryPath/);
 assert.match(guard,/hash!==entry/);
 assert.match(guard,/if\(first\.map!==second\.map \|\| first\.entry!==second\.entry\)/);
 assert.match(guard,/generator.*System Map/i);
});
