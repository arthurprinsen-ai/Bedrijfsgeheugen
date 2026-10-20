import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=path.resolve(process.argv.find(a=>a.startsWith('--root='))?.slice(7)||'.');
const write=process.argv.includes('--write');
const source='platform/system-map/canonical-system-map.mjs';
const directories={githubWorkflows:'.github/workflows',netlifyFunctions:'netlify/functions',supabaseFunctions:'supabase/functions',skills:'.agents/skills',agentFabricModules:'platform/agents'};
const surfaces=['portal-v2/modules/powerhouse-observability.js','portal-v2/page-registry.js','portal-v2/page-shell.js','portal-v2/page-metrics.js','portal-v2/page-visuals.js','portal-v2/doorwerking.js','portal-v2/legacy-parity-engine.js','portal-v2/runtime-evidence.js','netlify/functions/powerhouse-observability.mjs'];
let original=await fs.readFile(path.join(root,source),'utf8');
let next=original;
const inventories={};
for(const [key,dir] of Object.entries(directories)){
  inventories[key]=(await fs.readdir(path.join(root,dir),{withFileTypes:true})).filter(e=>e.isFile()||e.isDirectory()).map(e=>e.name).sort();
  const pattern=new RegExp('    '+key+':Object\\.freeze\\(\\[[^\\n]*\\]\\)');
  if(!pattern.test(next))throw new Error('SYSTEM_MAP_INVENTORY_CONTRACT_MISSING:'+key);
  next=next.replace(pattern,'    '+key+':Object.freeze('+JSON.stringify(inventories[key])+')');
}
next=next.replace(/github:Object\.freeze\(\{workflows:\d+,skills:\d+,agentFabricModules:\d+\}\)/,`github:Object.freeze({workflows:${inventories.githubWorkflows.length},skills:${inventories.skills.length},agentFabricModules:${inventories.agentFabricModules.length}})`);
next=next.replace(/netlify:Object\.freeze\(\{functions:\d+\}\)/,`netlify:Object.freeze({functions:${inventories.netlifyFunctions.length}})`);
const hash=createHash('sha256');
hash.update(JSON.stringify(inventories));
for(const file of surfaces){
  hash.update(file);
  hash.update(await fs.readFile(path.join(root,file)));
}
const contentHash=hash.digest('hex');
const provenance=`  explanationInventory:Object.freeze({contract:'portal-explanation-autosync-v1',contentHash:'${contentHash}',authority:'repository-source',providerRuntimeVerified:false}),`;
if(/^  explanationInventory:.*$/m.test(next))next=next.replace(/^  explanationInventory:.*$/m,provenance);
else next=next.replace(/^(  observedAt:.*)$/m,'$1\n'+provenance);
if(next!==original){
  if(!write){console.error('SYSTEM_MAP_WRITEBACK_INCOMPLETE: portal explanation source/inventory drift; refresh in the existing protected candidate with --write, then review semantic changes.');process.exitCode=1;}
  else{
    next=next.replace(/^  observedAt:.*$/m,`  observedAt:'${new Date().toISOString()}',`);
    await fs.writeFile(path.join(root,source),next);
    console.log('PORTAL_EXPLANATION_SOURCE_REFRESHED',JSON.stringify({contentHash,counts:Object.fromEntries(Object.entries(inventories).map(([k,v])=>[k,v.length])),providerRuntimeVerified:false}));
  }
}else console.log('PORTAL_EXPLANATION_SOURCE_CURRENT',contentHash);
