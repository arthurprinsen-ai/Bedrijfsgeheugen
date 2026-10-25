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
const normalizeAssetVersion=value=>String(value).replace(/[?&]bg_explain=[a-f0-9]{64}/g,'');
async function portalAssets(dir='portal-v2'){
  const found=[];
  for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){
    const relative=dir+'/'+entry.name;
    if(entry.isDirectory() && !['tests','node_modules'].includes(entry.name))found.push(...await portalAssets(relative));
    else if(entry.isFile() && /\.(js|css)$/.test(entry.name))found.push(relative);
  }
  return found.sort();
}
const assets=await portalAssets();
const hash=createHash('sha256');
hash.update(JSON.stringify(inventories));
for(const file of [...new Set([...surfaces,...assets])].sort()){
  hash.update(file);
  hash.update(normalizeAssetVersion(await fs.readFile(path.join(root,file),'utf8')));
}
let entryHtml=null;
try{entryHtml=await fs.readFile(path.join(root,'portal-v2/index.html'),'utf8');hash.update(normalizeAssetVersion(entryHtml));}catch(e){if(e.code!=='ENOENT')throw e;}
const contentHash=hash.digest('hex');
const provenance=`  explanationInventory:Object.freeze({contract:'portal-explanation-autosync-v1',contentHash:'${contentHash}',authority:'repository-source',providerRuntimeVerified:false}),`;
if(/^  explanationInventory:.*$/m.test(next))next=next.replace(/^  explanationInventory:.*$/m,provenance);
else next=next.replace(/^(  observedAt:.*)$/m,'$1\n'+provenance);
if(next!==original){
  if(!write){console.error('SYSTEM_MAP_WRITEBACK_INCOMPLETE: portal explanation source/inventory drift; calculated SHA256='+contentHash+'; refresh in the existing protected candidate with --write, then review semantic changes.');process.exitCode=1;}
  else{
    // Stable generated content for identical source trees; no wall-clock mutations.
    await fs.writeFile(path.join(root,source),next);
    console.log('PORTAL_EXPLANATION_SOURCE_REFRESHED',JSON.stringify({contentHash,counts:Object.fromEntries(Object.entries(inventories).map(([k,v])=>[k,v.length])),providerRuntimeVerified:false}));
  }
}else console.log('PORTAL_EXPLANATION_SOURCE_CURRENT',contentHash);

if(write && process.argv.includes('--stamp-assets')){
  const version=url=>url+(url.includes('?')?'&':'?')+'bg_explain='+contentHash;
  for(const file of assets.filter(p=>p.endsWith('.js'))){
    const before=await fs.readFile(path.join(root,file),'utf8');
    const clean=normalizeAssetVersion(before);
    let after=clean.replace(/(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.\.?\/[^'"]+\.js(?:\?[^'"]*)?)\2/g,(_,prefix,quote,url)=>prefix+quote+version(url)+quote);
    after=after.replace(/(['"])(\.\.?\/[^'"]+\.css(?:\?[^'"]*)?)\1/g,(_,quote,url)=>quote+version(url)+quote);
    if(after!==before)await fs.writeFile(path.join(root,file),after);
  }
  if(entryHtml!==null){
    const after=normalizeAssetVersion(entryHtml).replace(/(\b(?:src|href)=)(['"])(\.\/[^'"]+\.(?:js|css)(?:\?[^'"]*)?)\2/g,(_,prefix,quote,url)=>prefix+quote+version(url)+quote);
    if(after!==entryHtml)await fs.writeFile(path.join(root,'portal-v2/index.html'),after);
  }
  console.log('PORTAL_EXPLANATION_ASSET_GRAPH_VERSIONED',contentHash);
}
